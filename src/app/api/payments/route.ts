import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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
        const { transactionId, paymentDate } = body;

        if (!transactionId) {
            return NextResponse.json({ message: "Transaction ID is required" }, { status: 400 });
        }

        // Create Payment Record
        const payment = await prisma.payment.create({
            data: {
                memberId,
                amount: 5000, // Fixed amount for now, or fetch from config
                year: new Date().getFullYear(),
                status: "PENDING",
                transactionId,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            },
        });

        // Update Member Status
        await prisma.member.update({
            where: { id: memberId },
            data: { status: "PAYMENT_PENDING" },
        });

        return NextResponse.json({ message: "Payment submitted successfully", paymentId: payment.id });

    } catch (error) {
        console.error("Payment submission error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
