import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        let tokenValue = "";
        if (authHeader && authHeader.startsWith("Bearer ")) {
            tokenValue = authHeader.split(" ")[1];
        } else {
            const cookieStore = await cookies();
            tokenValue = cookieStore.get("member_token")?.value || "";
        }

        if (!tokenValue) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );

        const { payload } = await jwtVerify(tokenValue, secret);
        const memberId = payload.id as string;

        const body = await request.json();
        const { transactionId, paymentDate } = body;

        const cleanUtr = typeof transactionId === "string" ? transactionId.trim() : "";
        if (!/^\d{12}$/.test(cleanUtr)) {
            return NextResponse.json(
                { message: "Please enter a valid 12-digit numeric UPI Transaction ID / UTR." },
                { status: 400 }
            );
        }

        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        const existingUtr = await prisma.payment.findFirst({
            where: {
                transactionId: cleanUtr,
                status: { in: ["PENDING", "PAID"] },
            },
        });
        if (existingUtr) {
            return NextResponse.json(
                { message: "This UTR / Transaction ID has already been submitted." },
                { status: 400 }
            );
        }

        const payableAmount = member.memberType === "NEW" ? 3776 : 1416;

        // Create Payment Record
        const payment = await prisma.payment.create({
            data: {
                memberId,
                amount: payableAmount,
                year: new Date().getFullYear(),
                status: "PENDING",
                transactionId: cleanUtr,
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
