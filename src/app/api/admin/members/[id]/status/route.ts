import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await request.json();
        const { status, approvalPresident, approvalSecretary, approvalTreasurer } = body;

        // Prepare update data
        const data: any = {};
        if (typeof approvalPresident === 'boolean') data.approvalPresident = approvalPresident;
        if (typeof approvalSecretary === 'boolean') data.approvalSecretary = approvalSecretary;
        if (typeof approvalTreasurer === 'boolean') data.approvalTreasurer = approvalTreasurer;

        // If status is provided, validate
        if (status) {
            if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
                return NextResponse.json({ message: "Invalid status" }, { status: 400 });
            }

            // If attempting to APPROVE, check condition
            if (status === "APPROVED") {
                // Fetch current member state to check approvals
                const currentMember = await prisma.member.findUnique({ where: { id } });
                if (!currentMember) return NextResponse.json({ message: "Member not found" }, { status: 404 });

                // Verify Permissions based on Token
                const cookieStore = await cookies();
                const token = cookieStore.get("admin_token");
                let role = "";
                if (token) {
                    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
                    try {
                        const { payload } = await jwtVerify(token.value, secret);
                        role = payload.role as string;

                        // Strict Role Checks
                        if (data.approvalPresident !== undefined && role !== "PRESIDENT" && role !== "SUPER_ADMIN") {
                            return NextResponse.json({ message: "Only President can update this." }, { status: 403 });
                        }
                        if (data.approvalSecretary !== undefined && role !== "SECRETARY" && role !== "SUPER_ADMIN") {
                            return NextResponse.json({ message: "Only Secretary can update this." }, { status: 403 });
                        }
                        if (data.approvalTreasurer !== undefined && role !== "TREASURER" && role !== "SUPER_ADMIN") {
                            return NextResponse.json({ message: "Only Treasurer can update this." }, { status: 403 });
                        }
                    } catch (e) {
                        // Token invalid/expired
                    }
                }

                // Combine current state with improved updates
                const p = data.approvalPresident ?? currentMember.approvalPresident;
                const s = data.approvalSecretary ?? currentMember.approvalSecretary;
                const t = data.approvalTreasurer ?? currentMember.approvalTreasurer;

                const approvalCount = (p ? 1 : 0) + (s ? 1 : 0) + (t ? 1 : 0);
                if (approvalCount < 2 && role !== "SUPER_ADMIN") {
                    return NextResponse.json(
                        { message: "At least 2 Committee approvals (President, Secretary, Treasurer) are required." },
                        { status: 400 }
                    );
                }
            }
            data.status = status;
        }

        const member = await prisma.member.update({
            where: { id },
            data,
        });

        return NextResponse.json({ member });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
