import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getFinancialYear } from "@/lib/financial-year";

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        // Verify Admin Token
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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

        // Generate Membership ID if not present (Format: AKEKM001)
        const currentMember = await prisma.member.findUnique({ where: { id } });
        let newMembershipId = undefined;

        if (currentMember && !currentMember.membershipId) {
            // Find last membership ID starting with AKEKM
            const lastMember = await prisma.member.findFirst({
                where: { membershipId: { startsWith: "AKEKM" } },
                orderBy: { membershipId: "desc" },
            });

            let nextIdNum = 1;
            if (lastMember && lastMember.membershipId) {
                const lastNum = parseInt(lastMember.membershipId.replace("AKEKM", ""), 10);
                if (!isNaN(lastNum)) {
                    nextIdNum = lastNum + 1;
                }
            }
            newMembershipId = `AKEKM${String(nextIdNum).padStart(3, "0")}`;
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



