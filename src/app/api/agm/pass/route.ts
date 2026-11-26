import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const passId = (searchParams.get("passId") || "").trim();

        if (!passId) {
            return NextResponse.json(
                { status: "error", message: "Please enter a Pass ID." },
                { status: 400 }
            );
        }

        const registration = await prisma.agmRegistration.findFirst({
            where: {
                passId: { equals: passId, mode: "insensitive" },
            },
        });

        if (!registration) {
            return NextResponse.json(
                { status: "error", message: `No pass found for Pass ID "${passId}".` },
                { status: 404 }
            );
        }

        return NextResponse.json({ status: "success", registration });
    } catch (error) {
        console.error("AGM pass lookup error:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to look up pass." },
            { status: 500 }
        );
    }
}
