import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
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

        const zip = new AdmZip();

        // 1. Add database
        const dbPath = path.join(process.cwd(), "prisma", "dev.db");
        if (fs.existsSync(dbPath)) {
            zip.addLocalFile(dbPath);
        }

        // 2. Add uploads folder
        const uploadsPath = path.join(process.cwd(), "public", "uploads");
        if (fs.existsSync(uploadsPath)) {
            zip.addLocalFolder(uploadsPath, "uploads");
        }

        const buffer = zip.toBuffer();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

        return new NextResponse(buffer as unknown as BodyInit, {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="akitda_backup_${timestamp}.zip"`,
            }
        });
    } catch (error) {
        console.error("Backup error:", error);
        return NextResponse.json({ message: (error as Error).message || "Failed to create backup" }, { status: 500 });
    }
}
