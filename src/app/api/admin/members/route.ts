import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const members = await prisma.member.findMany({
            orderBy: { joinedAt: "desc" },
            include: {
                payments: true,
                partners: true
            }
        });
        return NextResponse.json({ members });
    } catch (error) {
        console.error("Failed to fetch members:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
