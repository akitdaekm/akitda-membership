import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NotificationService } from "@/lib/notifications";
import { getFinancialYear } from "@/lib/financial-year";

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;

        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
            await jwtVerify(token.value, secret);
        } catch {
            return NextResponse.json({ message: "Invalid or expired admin session" }, { status: 401 });
        }

        const member = await prisma.member.findUnique({ where: { id } });
        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        const approvalCount =
            (member.approvalPresident ? 1 : 0) +
            (member.approvalSecretary ? 1 : 0) +
            (member.approvalTreasurer ? 1 : 0);

        if (approvalCount < 2) {
            return NextResponse.json(
                { message: "At least 2 Committee approvals (President, Secretary, Treasurer) are required before sending a payment link." },
                { status: 400 }
            );
        }

        const body = await request.json();
        const feeType: "NEW" | "RENEWAL" | "CUSTOM" = body.feeType || "NEW";
        const amount = Number(body.amount);
        const customLink = typeof body.paymentLink === "string" ? body.paymentLink.trim() : "";

        if (!amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ message: "Valid payment amount is required." }, { status: 400 });
        }

        const upiLink =
            customLink ||
            `upi://pay?pa=8547026604@okbizaxis&pn=AKITDA&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`AKITDA-${member.id.slice(-6)}`)}`;

        const feeLabel =
            feeType === "NEW"
                ? "New Membership Fee (Admission + Annual + GST)"
                : feeType === "RENEWAL"
                ? "Annual Renewal Fee (including GST)"
                : "AKITDA Membership Fee";

        const { startYear } = getFinancialYear();

        // Create a PENDING payment record with the exact amount requested by PST
        await prisma.payment.create({
            data: {
                memberId: id,
                amount,
                year: startYear,
                status: "PENDING",
                transactionId: `PST_LINK_${Date.now()}`,
                breakdown: JSON.stringify({ feeType, feeLabel, paymentLink: upiLink }),
            },
        });

        await prisma.member.update({
            where: { id },
            data: {
                status: "PAYMENT_PENDING",
                memberType: feeType === "RENEWAL" ? "EXISTING" : member.memberType,
            },
        });

        const message = `Dear ${member.companyName},\n\nYour AKITDA application is approved! Please complete your ${feeLabel} payment of Rs. ${amount.toFixed(2)} using the link below:\n\n${upiLink}\n\n(UPI ID: 8547026604@okbizaxis)\n\nOnce you complete the payment, please share the payment screenshot/UTR with our committee so we can activate your membership.`;

        await Promise.all([
            NotificationService.send("WHATSAPP", {
                to: member.primaryMobile,
                message,
            }),
            NotificationService.send("EMAIL", {
                to: member.primaryEmail,
                subject: `AKITDA Payment Request - Rs. ${amount.toFixed(2)}`,
                message,
            }),
        ]);

        return NextResponse.json({
            message: `Payment link for Rs. ${amount.toFixed(2)} sent to WhatsApp & Email.`,
        });
    } catch (error) {
        console.error("Send payment link error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
