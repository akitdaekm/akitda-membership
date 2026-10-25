import { NextResponse } from "next/server";
import { getPrograms, savePrograms } from "@/lib/programs";
import { saveUploadedFile } from "@/lib/upload";

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const formData = await request.formData();

        const title = (formData.get("title") as string)?.trim();
        const date = (formData.get("date") as string)?.trim() || "Upcoming";
        const venue = (formData.get("venue") as string)?.trim() || "Ernakulam";
        const category = (formData.get("category") as string)?.trim() || "Upcoming Program";
        const description = (formData.get("description") as string)?.trim() || "";
        const orderRaw = formData.get("order");
        const order = orderRaw ? parseInt(orderRaw as string, 10) : 1;
        const posterFile = formData.get("posterFile");

        if (!title) {
            return NextResponse.json({ message: "Program title is required." }, { status: 400 });
        }

        const currentPrograms = await getPrograms();
        const existingIndex = currentPrograms.findIndex((p) => p.id === id);

        if (existingIndex === -1) {
            return NextResponse.json({ message: "Program not found." }, { status: 404 });
        }

        let posterUrl = currentPrograms[existingIndex].posterUrl || null;
        if (posterFile && posterFile instanceof File && posterFile.size > 0 && posterFile.name !== "undefined") {
            posterUrl = await saveUploadedFile(posterFile, "uploads/programs", "program");
        }

        const updatedItem = {
            ...currentPrograms[existingIndex],
            title,
            date,
            venue,
            category,
            description,
            posterUrl,
            order: isNaN(order) ? currentPrograms[existingIndex].order : order,
        };

        const nextPrograms = [...currentPrograms];
        nextPrograms[existingIndex] = updatedItem;

        const saved = await savePrograms(nextPrograms);
        return NextResponse.json({ item: updatedItem, programs: saved });
    } catch (error: any) {
        console.error("Error updating program:", error);
        return NextResponse.json(
            { message: error.message || "Failed to update program" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const currentPrograms = await getPrograms();
        const filtered = currentPrograms.filter((p) => p.id !== id);

        const saved = await savePrograms(filtered);
        return NextResponse.json({ message: "Program deleted", programs: saved });
    } catch (error: any) {
        console.error("Error deleting program:", error);
        return NextResponse.json(
            { message: error.message || "Failed to delete program" },
            { status: 500 }
        );
    }
}
