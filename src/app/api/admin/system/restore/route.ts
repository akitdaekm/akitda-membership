import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import AdmZip from "adm-zip";
import path from "path";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );
        const { payload } = await jwtVerify(token, secret);
        const admin = await prisma.admin.findUnique({
            where: { id: payload.id as string }
        });

        if (!admin || admin.role !== "SUPER_ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

        const formData = await request.formData();
        const file = formData.get("backupFile") as File;

        if (!file) {
            return NextResponse.json({ message: "No backup file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        // Basic validation: Check if dev.db exists in the archive
        const hasDb = zipEntries.some((entry: AdmZip.IZipEntry) => entry.entryName === "dev.db");
        if (!hasDb) {
            return NextResponse.json({ message: "Invalid backup file: dev.db missing" }, { status: 400 });
        }

        const prismaPath = path.join(process.cwd(), "prisma");
        const publicPath = path.join(process.cwd(), "public");

        for (const entry of zipEntries) {
            if (entry.entryName === "dev.db") {
                zip.extractEntryTo(entry, prismaPath, false, true);
            } else if (entry.entryName.startsWith("uploads/")) {
                zip.extractEntryTo(entry, publicPath, true, true);
            }
        }

        return NextResponse.json({ message: "System restored successfully from backup!" });
    } catch (error) {
        console.error("Restore error:", error);
        return NextResponse.json({ message: (error as Error).message || "Failed to restore system" }, { status: 500 });
    }
}
