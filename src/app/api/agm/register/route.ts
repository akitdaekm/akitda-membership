import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function generatePassId(): string {
    return `AK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function normalizePhoneKey(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const name = String(body.name || "").trim();
        const company = String(body.company || "").trim();
        const designation = String(body.designation || "Member").trim() || "Member";
        const district = String(body.district || "Ernakulam").trim() || "Ernakulam";
        const phone = String(body.phone || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const memberId = body.memberId ? String(body.memberId).trim() : null;

        if (!name || !company || !phone) {
            return NextResponse.json(
                { status: "error", message: "Full Name, Company Name, and Phone Number are required." },
                { status: 400 }
            );
        }

        const phoneKey = normalizePhoneKey(phone);
        if (phoneKey.length < 10) {
            return NextResponse.json(
                { status: "error", message: "Please enter a valid 10-digit phone number." },
                { status: 400 }
            );
        }

        // Block duplicate registrations by normalized phone number or email address
        const existingRegistrations = await prisma.agmRegistration.findMany({
            select: { id: true, passId: true, phone: true, email: true },
        });

        const phoneDuplicate = existingRegistrations.find(
            (r) => normalizePhoneKey(r.phone) === phoneKey
        );
        if (phoneDuplicate) {
            return NextResponse.json(
                {
                    status: "error",
                    existingPassId: phoneDuplicate.passId,
                    message: `This phone number is already registered (Pass ID: ${phoneDuplicate.passId}). Duplicate registrations are not allowed. Please contact the AKITDA Admin if you need changes.`,
                },
                { status: 409 }
            );
        }

        if (email) {
            const emailDuplicate = existingRegistrations.find(
                (r) => r.email && r.email.trim().toLowerCase() === email
            );
            if (emailDuplicate) {
                return NextResponse.json(
                    {
                        status: "error",
                        existingPassId: emailDuplicate.passId,
                        message: `This email address is already registered (Pass ID: ${emailDuplicate.passId}). Duplicate registrations are not allowed. Please contact the AKITDA Admin if you need changes.`,
                    },
                    { status: 409 }
                );
            }
        }

        const qrPayload = `${name}|${company}|${designation}|${district}|${phone}`;

        let passId = generatePassId();
        for (let i = 0; i < 5; i++) {
            const clash = await prisma.agmRegistration.findUnique({ where: { passId } });
            if (!clash) break;
            passId = generatePassId();
        }

        const registration = await prisma.agmRegistration.create({
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

        return NextResponse.json({ status: "success", registration });
    } catch (error) {
        console.error("AGM registration error:", error);
        return NextResponse.json(
            { status: "error", message: "Registration failed. Please try again." },
            { status: 500 }
        );
    }
}
