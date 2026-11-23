import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedAdmin } from "@/lib/admin-auth";
import { getFinancialYear } from "@/lib/financial-year";
import { generateNextMembershipId } from "@/lib/membership-id";

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        // Verify Admin (cookie or mobile Bearer) + permission
        const admin = await getAuthedAdmin(request);
        if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        if (!admin.permissions.verifyPayments) {
            return NextResponse.json({ message: "You do not have permission to verify payments." }, { status: 403 });
        }

        // Logic to verify payment
        // 1. Update Payment Status to PAID
        // 2. Generate Receipt Number
        // 3. Update Member Status to ACTIVE

        const payment = await prisma.payment.findFirst({
            where: { memberId: id, status: "PENDING" },
            orderBy: { createdAt: "desc" }
        });

        if (!payment) {
            return NextResponse.json({ message: "No pending payment found" }, { status: 404 });
        }

        let action = "APPROVE";
        let reason = "";
        try {
            const body = await request.json();
            if (body?.action === "DECLINE") {
                action = "DECLINE";
                reason = typeof body.reason === "string" ? body.reason.trim() : "";
            }
        } catch {
            // Empty body defaults to APPROVE
        }

        if (action === "DECLINE") {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "DECLINED",
                    breakdown: JSON.stringify({
                        declineReason: reason || "Payment not received / Declined by admin",
                    }),
                },
            });

            await prisma.member.update({
                where: { id },
                data: { status: "APPROVED" },
            });

            return NextResponse.json({ message: "Payment marked as declined" });
        }

        // Generate Receipt Number: EKM/YYYY/XXX (e.g., EKM/2526/001)
        const { startYear, endYear } = getFinancialYear();
        const count = await prisma.payment.count({
            where: {
                status: "PAID",
                year: startYear
            }
        });

        const shortStartYear = startYear.toString().slice(-2);
        const shortEndYear = endYear.toString().slice(-2);
        const receiptNumber = `EKM/${shortStartYear}${shortEndYear}/${String(count + 1).padStart(3, "0")}`;

        // Update Payment and Member
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: "PAID",
                paymentDate: new Date(),
                receiptNumber,
                year: startYear // Store Financial Start Year
            }
        });

        // Generate Membership ID if not present (Format: AKITDA | EKM | 001)
        const currentMember = await prisma.member.findUnique({ where: { id } });
        let newMembershipId = undefined;

        if (currentMember && !currentMember.membershipId) {
            newMembershipId = await generateNextMembershipId();
        }

        // Calculate validUntil: 1 year from today
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);

        await prisma.member.update({
            where: { id },
            data: {
                status: "ACTIVE",
                membershipId: newMembershipId || undefined,
                validUntil: validUntil,
            }
        });

        // Send Notifications
        if (currentMember) {
            const { NotificationService } = await import("@/lib/notifications");
            const phone = currentMember.primaryMobile;
            const email = currentMember.primaryEmail;
            const name = currentMember.companyName;

            // Log the action (Mock)
            await NotificationService.sendInvoiceNotification(name, phone, email, receiptNumber);
        }

        return NextResponse.json({ message: "Payment verified successfully", receiptNumber, membershipId: newMembershipId });

    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}



