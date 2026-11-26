import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedAdmin } from "@/lib/admin-auth";

function csvCell(val: unknown): string {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

export async function GET(request: Request) {
    const admin = await getAuthedAdmin(request);
    if (!admin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "scans";

    if (type === "registrations") {
        const rows = await prisma.agmRegistration.findMany({
            include: { scans: { orderBy: { scannedAt: "desc" } } },
            orderBy: { registeredAt: "desc" },
        });
        const header = ["Pass ID", "Name", "Company", "Designation", "District", "Phone", "Email", "Registered At", "Check-Ins"];
        const lines = [
            header.join(","),
            ...rows.map((r) =>
                [
                    r.passId,
                    r.name,
                    r.company,
                    r.designation,
                    r.district,
                    r.phone,
                    r.email || "",
                    r.registeredAt.toISOString(),
                    r.scans.length,
                ]
                    .map(csvCell)
                    .join(",")
            ),
        ];
        return new NextResponse(lines.join("\n"), {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": 'attachment; filename="akitda_agm_2026_passes.csv"',
            },
        });
    }

    const scans = await prisma.agmScan.findMany({ orderBy: { scannedAt: "desc" } });
    const header = ["Scan ID", "Name", "Company", "Designation", "District", "Phone", "Scanned At"];
    const lines = [
        header.join(","),
        ...scans.map((s) =>
            [s.id, s.name, s.company, s.designation || "", s.district || "", s.phone || "", s.scannedAt.toISOString()]
                .map(csvCell)
                .join(",")
        ),
    ];
    return new NextResponse(lines.join("\n"), {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="akitda_agm_2026_attendance.csv"',
        },
    });
}
