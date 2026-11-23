import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NotificationService } from "@/lib/notifications";
import { getFinancialYear } from "@/lib/financial-year";
import { generateNextMembershipId } from "@/lib/membership-id";

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await request.json();
        const { status, approvalPresident, approvalSecretary, approvalTreasurer, markExistingPaid, memberType } = body;

        const currentMember = await prisma.member.findUnique({ where: { id } });
        if (!currentMember) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        // Verify Admin Token & Role
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        let role = "";
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
            const { payload } = await jwtVerify(token.value, secret);
            role = payload.role as string;
        } catch {
            return NextResponse.json({ message: "Invalid or expired admin session" }, { status: 401 });
        }

        // Prepare update data
        const data: any = {};
        if (typeof approvalPresident === "boolean") data.approvalPresident = approvalPresident;
        if (typeof approvalSecretary === "boolean") data.approvalSecretary = approvalSecretary;
        if (typeof approvalTreasurer === "boolean") data.approvalTreasurer = approvalTreasurer;
        if (memberType === "NEW" || memberType === "EXISTING") {
            data.memberType = memberType;
        }

        // Strict Role Checks for committee approval checkboxes
        if (data.approvalPresident !== undefined && role !== "PRESIDENT" && role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Only President can update this." }, { status: 403 });
        }
        if (data.approvalSecretary !== undefined && role !== "SECRETARY" && role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Only Secretary can update this." }, { status: 403 });
        }
        if (data.approvalTreasurer !== undefined && role !== "TREASURER" && role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Only Treasurer can update this." }, { status: 403 });
        }

        const p = data.approvalPresident ?? currentMember.approvalPresident;
        const s = data.approvalSecretary ?? currentMember.approvalSecretary;
        const t = data.approvalTreasurer ?? currentMember.approvalTreasurer;
        const approvalCount = (p ? 1 : 0) + (s ? 1 : 0) + (t ? 1 : 0);

        // Handle Existing Member "Already Paid / Skip Payment & Activate"
        if (markExistingPaid) {
            if (approvalCount < 2) {
                return NextResponse.json(
                    { message: "At least 2 Committee approvals (President, Secretary, Treasurer) are required before activating." },
                    { status: 400 }
                );
            }

            let newMembershipId = currentMember.membershipId;
            if (!newMembershipId) {
                newMembershipId = await generateNextMembershipId();
            }

            const validUntil = new Date();
            validUntil.setFullYear(validUntil.getFullYear() + 1);
            const { startYear } = getFinancialYear();

            await prisma.payment.create({
                data: {
                    memberId: id,
                    amount: 0,
                    year: startYear,
                    status: "PAID",
                    transactionId: `EXISTING_PAID_${Date.now()}`,
                    paymentDate: new Date(),
                    breakdown: JSON.stringify({ note: "Marked already paid by committee" }),
                },
            });

            data.status = "ACTIVE";
            data.membershipId = newMembershipId;
            data.validUntil = validUntil;
            data.memberType = "EXISTING";

            const member = await prisma.member.update({ where: { id }, data });

            try {
                await NotificationService.sendActivationNotification(
                    member.companyName,
                    member.primaryMobile,
                    member.primaryEmail,
                    member.membershipId || undefined
                );
            } catch (notifyErr) {
                console.warn("Activation notification failed:", notifyErr);
            }

            return NextResponse.json({ member });
        }

        // Validate explicit status if provided
        if (status) {
            if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
                return NextResponse.json({ message: "Invalid status" }, { status: 400 });
            }

            if (status === "APPROVED" && approvalCount < 2) {
                return NextResponse.json(
                    { message: "At least 2 Committee approvals (President, Secretary, Treasurer) are required." },
                    { status: 400 }
                );
            }
            data.status = status;
        } else if (
            approvalCount >= 2 &&
            (currentMember.status === "PENDING" || currentMember.status === "PROFILE_PENDING")
        ) {
            // Auto-approve when 2 of 3 committee members have approved
            data.status = "APPROVED";
        }

        const wasAlreadyApprovedOrActive =
            currentMember.status === "APPROVED" ||
            currentMember.status === "PAYMENT_PENDING" ||
            currentMember.status === "ACTIVE";

        const member = await prisma.member.update({
            where: { id },
            data,
        });

        // Send Approval Notification (WhatsApp & Email) when newly approved
        if (member.status === "APPROVED" && !wasAlreadyApprovedOrActive) {
            try {
                await NotificationService.sendApprovalNotification(
                    member.companyName,
                    member.primaryMobile,
                    member.primaryEmail
                );
            } catch (notifyErr) {
                console.warn("Approval notification failed:", notifyErr);
            }
        }

        return NextResponse.json({ member });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
