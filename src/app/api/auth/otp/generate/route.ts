import { NextResponse } from "next/server";
import { generateAndSaveOtp } from "@/lib/otp";

export async function POST(request: Request) {
    try {
        const { identifier } = await request.json();

        if (!identifier) {
            return NextResponse.json({ message: "Identifier required" }, { status: 400 });
        }

        const result = await generateAndSaveOtp(identifier);

        if (!result.success) {
            return NextResponse.json({ message: result.message }, { status: 400 });
        }

        return NextResponse.json({
            message: result.message,
            emailStatus: result.emailStatus,
            smsStatus: result.smsStatus,
        });
    } catch (error) {
        console.error("OTP Generation Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
