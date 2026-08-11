import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { saveUploadedFile } from "@/lib/upload";

async function isAdmin() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");
        if (!token) return false;
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
        await jwtVerify(token.value, secret);
        return true;
    } catch {
        return false;
    }
}

export async function GET() {
    const items = await prisma.galleryItem.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ items });
}

export async function POST(request: Request) {
    if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const formData = await request.formData();
        const title = formData.get("title") as string;
        const type = formData.get("type") as string;
        const description = formData.get("description") as string;
        const videoUrl = formData.get("videoUrl") as string;
        const photoFile = formData.get("photoFile") as File | null;

        let url = "";

        if (type === "PHOTO") {
            if (!photoFile) {
                return NextResponse.json({ message: "Photo file is required" }, { status: 400 });
            }
            url = await saveUploadedFile(photoFile, "uploads/gallery", "gallery");
        } else if (type === "VIDEO") {
            if (!videoUrl) {
                return NextResponse.json({ message: "Video URL is required" }, { status: 400 });
            }
            url = videoUrl;
        }

        const item = await prisma.galleryItem.create({
            data: {
                title,
                type,
                description,
                url,
            },
        });
        return NextResponse.json(item);
    } catch (e: any) {
        console.error("Gallery upload error:", e);
        return NextResponse.json({ message: e.message || "Failed to upload" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

        await prisma.galleryItem.delete({ where: { id } });
        return NextResponse.json({ message: "Deleted" });
    } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}
