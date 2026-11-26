import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedAdmin } from "@/lib/admin-auth";

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const admin = await getAuthedAdmin(request);
    if (!admin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await props.params;
        await prisma.agmScan.delete({ where: { id } });
        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("Delete AGM scan error:", error);
        return NextResponse.json({ status: "error", message: "Failed to delete scan" }, { status: 500 });
    }
}
