import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("q") || "").trim();

        const members = await prisma.member.findMany({
            where: q
                ? {
                      OR: [
                          { companyName: { contains: q, mode: "insensitive" } },
                          { primaryMobile: { contains: q } },
                          { membershipId: { contains: q, mode: "insensitive" } },
                          { partners: { some: { name: { contains: q, mode: "insensitive" } } } },
                      ],
                  }
                : undefined,
            include: {
                partners: {
                    orderBy: { id: "asc" },
                    take: 1,
                },
            },
            orderBy: [{ status: "asc" }, { companyName: "asc" }],
            take: 30,
        });

        const formatted = members.map((m) => ({
            id: m.id,
            name: m.partners?.[0]?.name || m.companyName,
            company: m.companyName,
            phone: m.primaryMobile,
            email: m.primaryEmail || "",
            district: m.district || "Ernakulam",
            membershipId: m.membershipId || null,
            status: m.status,
        }));

        return NextResponse.json({ members: formatted, count: formatted.length });
    } catch (error) {
        console.error("AGM member search error:", error);
        return NextResponse.json({ message: "Failed to search members" }, { status: 500 });
    }
}
