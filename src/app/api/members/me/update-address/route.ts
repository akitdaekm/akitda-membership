import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { verifyAndClearOtp } from "@/lib/otp";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("member_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );

        const { payload } = await jwtVerify(token.value, secret);
        const memberId = payload.id as string;

        const body = await request.json();
        const { otp, primaryEmail, gstNumber, companyType, addressBuilding, addressArea, district, unit, pincode } = body;

        const verification = await verifyAndClearOtp(memberId, otp);
        if (!verification.success) {
            return NextResponse.json(
                { message: verification.message },
                { status: 400 }
            );
        }

        // Check if email is already taken by a DIFFERENT member
        if (primaryEmail) {
            const existingMemberWithEmail = await prisma.member.findUnique({
                where: { primaryEmail }
            });

            if (existingMemberWithEmail && existingMemberWithEmail.id !== memberId) {
                // Ignore placeholder conflicts gracefully by skipping update or return error
                if (!primaryEmail.startsWith("pending_")) {
                    return NextResponse.json({ message: "This email address is already in use by another member." }, { status: 400 });
                }
            }
        }

        // Update Member Details
        const updatedMember = await prisma.member.update({
            where: { id: memberId },
            data: {
                primaryEmail,
                gstNumber,
                companyType,
                addressBuilding,
                addressArea,
                district,
                unit,
                pincode,
            },
        });

        return NextResponse.json({ message: "Address updated successfully", member: updatedMember });

    } catch (error) {
        console.error("Update Address Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
