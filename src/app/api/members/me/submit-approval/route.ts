import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("member_token");
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
        const { payload } = await jwtVerify(token.value, secret);
        const memberId = payload.id as string;

        const member = await prisma.member.findUnique({ where: { id: memberId } });

        if (!member) return NextResponse.json({ message: "Member not found" }, { status: 404 });

        if (member.status !== "PROFILE_PENDING") {
            return NextResponse.json({ message: "Profile already submitted or active." }, { status: 400 });
        }

        // Validate that they changed the placeholders
        if (member.addressBuilding === "To be updated by user" || member.addressArea === "To be updated") {
            return NextResponse.json({ message: "Please update your business address before submitting." }, { status: 400 });
        }

        if (!member.gstFile) {
            return NextResponse.json({ message: "Please upload your GST Certificate before submitting." }, { status: 400 });
        }

        await prisma.member.update({
            where: { id: memberId },
            data: { status: "PENDING" }
        });

        return NextResponse.json({ message: "Profile submitted for approval successfully." });

    } catch (error) {
        console.error("[Submit Approval] Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
