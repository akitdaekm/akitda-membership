import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthedAdmin } from "@/lib/admin-auth";
import { getAgmAuth } from "@/lib/agm-auth";

export async function GET(request: Request) {
    const admin = await getAuthedAdmin(request);
    if (!admin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const scans = await prisma.agmScan.findMany({
            orderBy: { scannedAt: "desc" },
        });
        return NextResponse.json({ scans, count: scans.length });
    } catch (error) {
        console.error("AGM scans fetch error:", error);
        return NextResponse.json({ message: "Failed to load scans" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await getAgmAuth(request);
    if (!auth) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const rawCode = String(body.code || "").trim();
        if (!rawCode) {
            return NextResponse.json({ status: "error", message: "No QR code provided." }, { status: 400 });
        }

        const parts = rawCode.split("|").map((p) => p.trim());
        let name = "";
        let company = "";
        let designation = "Member";
        let district = "Ernakulam";
        let phone = "";

        if (parts.length >= 5) {
            [name, company, designation, district, phone] = parts;
        } else if (parts.length >= 2) {
            name = parts[0];
            company = parts[1];
            designation = parts[2] || "Member";
            district = parts[3] || "Ernakulam";
        } else {
            const matched = await prisma.agmRegistration.findFirst({
                where: {
                    OR: [
                        { passId: { equals: rawCode, mode: "insensitive" } },
                        { phone: rawCode },
                    ],
                },
            });
            if (matched) {
                name = matched.name;
                company = matched.company;
                designation = matched.designation;
                district = matched.district;
                phone = matched.phone;
            } else {
                name = rawCode;
                company = "AKITDA Member";
            }
        }

        const previousScan = await prisma.agmScan.findFirst({
            where: {
                OR: [
                    ...(phone ? [{ phone }] : []),
                    {
                        AND: [
                            { name: { equals: name, mode: "insensitive" } },
                            { company: { equals: company, mode: "insensitive" } },
                        ],
                    },
                ],
            },
            orderBy: { scannedAt: "desc" },
        });

        let reg = await prisma.agmRegistration.findFirst({
            where: {
                OR: [
                    ...(phone ? [{ phone }] : []),
                    {
                        AND: [
                            { name: { equals: name, mode: "insensitive" } },
                            { company: { equals: company, mode: "insensitive" } },
                        ],
                    },
                ],
            },
        });

        if (!reg) {
            const passId = `AK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
            reg = await prisma.agmRegistration.create({
                data: {
                    passId,
                    name,
                    company,
                    designation,
                    district,
                    phone,
                    qrPayload: rawCode,
                },
            });
        }

        const scan = await prisma.agmScan.create({
            data: {
                registrationId: reg.id,
                name,
                company,
                designation,
                district,
                phone,
                fullCode: rawCode,
                badgePrinted: true,
            },
        });

        return NextResponse.json({
            status: "success",
            isDuplicate: Boolean(previousScan),
            scan,
            previousScan,
        });
    } catch (error) {
        console.error("AGM scan record error:", error);
        return NextResponse.json({ status: "error", message: "Failed to record scan." }, { status: 500 });
    }
}
