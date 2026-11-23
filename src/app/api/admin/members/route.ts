import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
    try {
        const admin = await getAuthedAdmin(request);
        if (!admin) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        if (!admin.permissions.viewMembers) {
            return NextResponse.json({ message: "You do not have permission to view members." }, { status: 403 });
        }

        const rows = await prisma.member.findMany({
            orderBy: { joinedAt: "desc" },
            include: {
                payments: true,
                partners: true
            }
        });

        // Never expose login OTPs
        const members = rows.map(({ otp: _otp, otpExpiry: _otpExpiry, ...rest }) => rest);
        return NextResponse.json({ members });
    } catch (error) {
        console.error("Failed to fetch members:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
