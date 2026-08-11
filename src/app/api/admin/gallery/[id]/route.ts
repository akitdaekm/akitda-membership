import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// HELPER: Verify Admin
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        await prisma.galleryItem.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Gallery item deleted" });
    } catch (error: any) {
        console.error("Gallery delete error:", error);
        return NextResponse.json({ message: error.message || "Failed to delete item" }, { status: 500 });
    }
}
