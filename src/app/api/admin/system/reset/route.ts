import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

const prismaClient = prisma;

// Helper to clear directories
async function clearDirectory(dirPath: string) {
    try {
        const fullPath = path.join(process.cwd(), "public", dirPath);
        const files = await fs.readdir(fullPath);
        for (const file of files) {
            // Keep any placeholder/default files if needed, else delete everything
            if (file !== '.gitkeep' && file !== 'placeholder.png') {
                const filePath = path.join(fullPath, file);
                const stat = await fs.stat(filePath);
                if (stat.isFile()) {
                    await fs.unlink(filePath);
                }
            }
        }
        console.log(`Cleared directory: ${fullPath}`);
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            console.error(`Error clearing directory ${dirPath}:`, error);
        }
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );

        const { payload } = await jwtVerify(token, secret);

        const admin = await prismaClient.admin.findUnique({
            where: { id: payload.id as string }
        });

        if (!admin || admin.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // 1. Delete all database records (Cascade will NOT work on deleteMany, need to delete in order)
        // Order matters for relational integrity if we weren't using cascade, but good practice anyway
        await prismaClient.payment.deleteMany({});
        await prismaClient.partner.deleteMany({});
        await prismaClient.member.deleteMany({});

        // 2. Clear relevant upload directories
        // Depending on your actual subdirectories in `public/uploads`
        const dirsToClear = [
            "uploads/partners",
            "uploads/gst",
            "uploads/receipts"
        ];

        for (const dir of dirsToClear) {
            await clearDirectory(dir);
        }

        return NextResponse.json({ message: "All membership data wiped successfully" });
    } catch (error: any) {
        console.error("Error wiping data:", error);
        return NextResponse.json(
            { message: error.message || "Failed to wipe data" },
            { status: 500 }
        );
    }
}
