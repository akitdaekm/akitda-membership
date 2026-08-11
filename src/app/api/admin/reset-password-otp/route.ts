import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { email, otp, newPassword } = await request.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const admin = await prisma.admin.findUnique({
            where: { email },
        });

        if (!admin || admin.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Invalid request" }, { status: 400 });
        }

        if (!admin.otp || !admin.otpExpiry) {
            return NextResponse.json({ message: "No OTP was requested" }, { status: 400 });
        }

        if (new Date() > admin.otpExpiry) {
            return NextResponse.json({ message: "OTP has expired. Please request a new one." }, { status: 400 });
        }

        if (admin.otp !== otp) {
            return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
        }

        // OTP is valid. Hash the new password.
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP
        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpiry: null,
            },
        });

        return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
