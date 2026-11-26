import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function generatePassId(): string {
    return `AK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const name = String(body.name || "").trim();
        const company = String(body.company || "").trim();
        const designation = String(body.designation || "Member").trim() || "Member";
        const district = String(body.district || "Ernakulam").trim() || "Ernakulam";
        const phone = String(body.phone || "").trim();
        const email = String(body.email || "").trim();
        const memberId = body.memberId ? String(body.memberId).trim() : null;

        if (!name || !company || !phone) {
            return NextResponse.json(
                { status: "error", message: "Full Name, Company Name, and Phone Number are required." },
                { status: 400 }
            );
        }

        const qrPayload = `${name}|${company}|${designation}|${district}|${phone}`;

        // Reuse passId if already registered with same phone or same name+company
        const existing = await prisma.agmRegistration.findFirst({
            where: {
                OR: [
                    { phone },
                    {
                        AND: [
                            { name: { equals: name, mode: "insensitive" } },
                            { company: { equals: company, mode: "insensitive" } },
                        ],
                    },
                ],
            },
        });

        let registration;
        if (existing) {
            registration = await prisma.agmRegistration.update({
                where: { id: existing.id },
                data: {
                    name,
                    company,
                    designation,
                    district,
                    phone,
                    email: email || existing.email,
                    qrPayload,
                    memberId: memberId || existing.memberId,
                },
            });
        } else {
            let passId = generatePassId();
            for (let i = 0; i < 5; i++) {
                const clash = await prisma.agmRegistration.findUnique({ where: { passId } });
                if (!clash) break;
                passId = generatePassId();
            }

            registration = await prisma.agmRegistration.create({
                data: {
                    passId,
                    name,
                    company,
                    designation,
                    district,
                    phone,
                    email: email || null,
                    qrPayload,
                    memberId,
                },
            });
        }

        return NextResponse.json({ status: "success", registration });
    } catch (error) {
        console.error("AGM registration error:", error);
        return NextResponse.json(
            { status: "error", message: "Registration failed. Please try again." },
            { status: 500 }
        );
    }
}
