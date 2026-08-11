import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

const prismaClient = prisma;

// Helper to delete multiple files if they exist
async function deleteFilesSafely(filePaths: (string | null | undefined)[]) {
    for (const filePath of filePaths) {
        if (!filePath) continue;

        try {
            // filePath might be something like '/uploads/gst/xyz.pdf'
            // Need to map it back to the public directory
            const fullPath = path.join(process.cwd(), "public", filePath);
            await fs.unlink(fullPath);
            console.log(`Deleted file: ${fullPath}`);
        } catch (error: any) {
            // Ignore if file doesn't exist (ENOENT)
            if (error.code !== "ENOENT") {
                console.error(`Failed to delete file: ${filePath}`, error);
            }
        }
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const paramsResolved = await params;
        const memberId = paramsResolved.id;

        if (!memberId) {
            return NextResponse.json({ message: "Member ID is required" }, { status: 400 });
        }

        // 1. Fetch member with all associations to get file paths
        const member = await prismaClient.member.findUnique({
            where: { id: memberId },
            include: {
                partners: true,
                payments: true,
            }
        });

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        // 2. Gather all file paths linked to this member
        const filesToDelete = [
            member.gstFile,
            ...member.partners.map(p => p.photoFile),
            ...member.payments.map(p => p.receiptUrl),
        ];

        // 3. Delete files from disk safely
        await deleteFilesSafely(filesToDelete);

        // 4. Delete the member (Prisma Cascade will handle related Partner/Payment DB records)
        await prismaClient.member.delete({
            where: { id: memberId }
        });

        return NextResponse.json({ message: "Member and associated data deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting member:", error);
        return NextResponse.json(
            { message: error.message || "Failed to delete member" },
            { status: 500 }
        );
    }
}
