import { NextResponse } from "next/server";
import { getPrograms, savePrograms, ProgramItem } from "@/lib/programs";
import { saveUploadedFile } from "@/lib/upload";

export async function GET() {
    try {
        const programs = await getPrograms();
        return NextResponse.json(programs);
    } catch (error: any) {
        console.error("Failed to fetch programs:", error);
        return NextResponse.json({ message: "Failed to fetch programs" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
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

        let posterUrl: string | null = null;
        if (posterFile && posterFile instanceof File && posterFile.size > 0 && posterFile.name !== "undefined") {
            posterUrl = await saveUploadedFile(posterFile, "uploads/programs", "program");
        }

        const currentPrograms = await getPrograms();
        const newProgram: ProgramItem = {
            id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title,
            date,
            venue,
            category,
            description,
            posterUrl,
            order: isNaN(order) ? currentPrograms.length + 1 : order,
            createdAt: new Date().toISOString(),
        };

        const updated = await savePrograms([...currentPrograms, newProgram]);
        return NextResponse.json({ item: newProgram, programs: updated });
    } catch (error: any) {
        console.error("Error creating program:", error);
        return NextResponse.json(
            { message: error.message || "Failed to create program" },
            { status: 500 }
        );
    }
}
