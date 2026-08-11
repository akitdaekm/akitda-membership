import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET() {
    try {
        const bearers = await prisma.officeBearer.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json(bearers);
    } catch {
        return NextResponse.json({ message: "Failed to fetch office bearers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const name = formData.get("name") as string;
        const position = formData.get("position") as string;
        const level = formData.get("level") as string; // STATE or DISTRICT
        const district = formData.get("district") as string | null;
        const phone = formData.get("phone") as string | null;

        const orderRaw = formData.get("order");
        const order = orderRaw ? parseInt(orderRaw as string) : 0;

        const photoFile = formData.get("photoFile");

        if (!name || !position || !level) {
            return NextResponse.json({ message: "Name, Position, and Level are required." }, { status: 400 });
        }

        let photoUrl = null;

        // Check if photoFile is a valid File object and has content
        if (photoFile && photoFile instanceof File && photoFile.size > 0 && photoFile.name !== "undefined") {
            const uploadDir = join(process.cwd(), "public", "uploads", "bearers");
            await mkdir(uploadDir, { recursive: true });

            const bytes = await photoFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `bearer-${Date.now()}-${photoFile.name.replace(/\s+/g, "_")}`;
            const filepath = join(uploadDir, filename);
            await writeFile(filepath, buffer);
            photoUrl = `/uploads/bearers/${filename}`;
        }

        const bearer = await prisma.officeBearer.create({
            data: {
                name,
                position,
                level,
                district: district === "undefined" ? null : district,
                phone: phone === "undefined" ? null : phone,
                order: isNaN(order) ? 0 : order,
                photoUrl,
            },
        });

        return NextResponse.json(bearer);
    } catch (error: any) {
        console.error("Error creating office bearer:", error);
        return NextResponse.json({ message: error.message || "Failed to create office bearer" }, { status: 500 });
    }
}
