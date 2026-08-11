import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        const admin = await prisma.admin.findUnique({
            where: { email },
        });

        if (!admin) {
            // Return 200 even if not found to prevent email enumeration
            return NextResponse.json({ message: "If the email is registered as a Superadmin, an OTP has been sent." }, { status: 200 });
        }

        if (admin.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Please contact the Administrator to reset your password." }, { status: 403 });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // OTP valid for 10 minutes
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                otp,
                otpExpiry,
            },
        });

        // =========================================================================
        // IMPORTANT NOTE FOR SMS OTP INTEGRATION
        // =========================================================================
        // Currently, the OTP is only logged to the server console.
        // To send this OTP to a mobile device via SMS, you need to integrate
        // an SMS gateway like Twilio, Fast2SMS, MSG91, or AWS SNS here.
        //
        // Example (Fast2SMS):
        // await fetch('https://www.fast2sms.com/dev/bulkV2', {
        //     method: 'POST',
        //     headers: { 'authorization': 'YOUR_API_KEY' },
        //     body: new URLSearchParams({ route: 'otp', variables_values: otp, numbers: admin.phone || '' })
        // });
        // =========================================================================

        return NextResponse.json({ message: "If the email is registered as a Superadmin, an OTP has been sent." }, { status: 200 });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
