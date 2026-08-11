import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const formData = await request.formData();

        const name = formData.get("name") as string;
        const position = formData.get("position") as string;
        const level = formData.get("level") as string;
        const district = formData.get("district") as string | null;
        const phone = formData.get("phone") as string | null;

        const orderRaw = formData.get("order");
        const order = orderRaw ? parseInt(orderRaw as string) : 0;

        const photoFile = formData.get("photoFile");

        // Prepare update data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {
            name,
            position,
            level,
            district: district === "undefined" ? null : district,
            phone: phone === "undefined" ? null : phone,
            order: isNaN(order) ? 0 : order,
        };

        // Handle Photo File if present and valid
        if (photoFile && photoFile instanceof File && photoFile.size > 0 && photoFile.name !== "undefined") {
            const uploadDir = join(process.cwd(), "public", "uploads", "bearers");
            await mkdir(uploadDir, { recursive: true });

            const bytes = await photoFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `bearer-${Date.now()}-${photoFile.name.replace(/\s+/g, "_")}`;
            const filepath = join(uploadDir, filename);
            await writeFile(filepath, buffer);
            data.photoUrl = `/uploads/bearers/${filename}`;
        }

        const bearer = await prisma.officeBearer.update({
            where: { id },
            data,
        });

        return NextResponse.json(bearer);

    } catch (error: any) {
        console.error("Error updating office bearer:", error);
        return NextResponse.json({ message: error.message || "Failed to update office bearer" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.officeBearer.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Office bearer deleted" });
    } catch (error: any) {
        console.error("Error deleting office bearer:", error);
        return NextResponse.json({ message: error.message || "Failed to delete office bearer" }, { status: 500 });
    }
}
