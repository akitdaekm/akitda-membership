import { NextResponse } from "next/server";
import { verifyAndClearOtp } from "@/lib/otp";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { identifier, otp } = body;

        if (!identifier || !otp) {
            return NextResponse.json(
                { message: "Identifier and OTP are required" },
                { status: 400 }
            );
        }

        const verification = await verifyAndClearOtp(identifier, otp);

        if (!verification.success || !verification.member) {
            return NextResponse.json(
                { message: verification.message },
                { status: 401 }
            );
        }

        const member = verification.member;

        if (member.status !== "APPROVED" && member.status !== "ACTIVE" && member.status !== "PAYMENT_PENDING") {
            return NextResponse.json(
                { message: "Membership not approved yet. Please wait for admin approval." },
                { status: 403 }
            );
        }

        // Generate Member Token
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );
        const token = await new SignJWT({ id: member.id, role: "MEMBER" })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h")
            .sign(secret);

        // Set Cookie
        (await cookies()).set("member_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return NextResponse.json({
            message: "Login successful",
            token: token
        });

    } catch (error) {
        console.error("[Verifying OTP] Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
