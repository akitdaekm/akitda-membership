import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET(request: Request) {
    try {
        // HYBRID AUTHENTICATION LOGIC
        // 1. Try to get the token from the Authorization header (For Mobile Apps)
        const authHeader = request.headers.get("Authorization");
        let tokenValue = "";

        if (authHeader && authHeader.startsWith("Bearer ")) {
            tokenValue = authHeader.split(" ")[1];
        } else {
            // 2. Fallback to extracting the HTTP-Only cookie (For Website Browser)
            const cookieStore = await cookies();
            const cookieToken = cookieStore.get("member_token");
            if (cookieToken) {
                tokenValue = cookieToken.value;
            }
        }

        if (!tokenValue) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );

        const { payload } = await jwtVerify(tokenValue, secret);
        const memberId = payload.id as string;

        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: {
                payments: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                },
                partners: true
            }
        });

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        return NextResponse.json({ member });

    } catch (error) {
        return NextResponse.json(
            { message: "Invalid token" },
            { status: 401 }
        );
    }
}
