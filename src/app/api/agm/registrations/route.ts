import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
    const admin = await getAuthedAdmin(request);
    if (!admin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("q") || "").trim();

        const registrations = await prisma.agmRegistration.findMany({
            where: q
                ? {
                      OR: [
                          { name: { contains: q, mode: "insensitive" } },
                          { company: { contains: q, mode: "insensitive" } },
                          { phone: { contains: q } },
                          { passId: { contains: q, mode: "insensitive" } },
                          { district: { contains: q, mode: "insensitive" } },
                      ],
                  }
                : undefined,
            include: {
                scans: {
                    orderBy: { scannedAt: "desc" },
                },
            },
            orderBy: { registeredAt: "desc" },
        });

        const formatted = registrations.map((r) => ({
            id: r.id,
            passId: r.passId,
            name: r.name,
            company: r.company,
            designation: r.designation,
            district: r.district,
            phone: r.phone,
            email: r.email,
            qrPayload: r.qrPayload,
            registeredAt: r.registeredAt,
            scanCount: r.scans.length,
            lastScannedAt: r.scans[0]?.scannedAt || null,
        }));

        return NextResponse.json({ registrations: formatted, count: formatted.length });
    } catch (error) {
        console.error("AGM registrations list error:", error);
        return NextResponse.json({ message: "Failed to load registrations" }, { status: 500 });
    }
}
