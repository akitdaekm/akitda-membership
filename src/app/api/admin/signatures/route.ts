import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";

export async function GET() {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: ["president_signature_url", "secretary_signature_url", "treasurer_signature_url", "official_seal_url"]
                }
            }
        });

        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json({
            presidentSignatureUrl: settingsMap["president_signature_url"] || null,
            secretarySignatureUrl: settingsMap["secretary_signature_url"] || null,
            treasurerSignatureUrl: settingsMap["treasurer_signature_url"] || null,
            officialSealUrl: settingsMap["official_seal_url"] || null,
        });
    } catch (error) {
        console.error("GET signatures error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const role = formData.get("role") as string;
        const file = formData.get("file") as File;

        if (!role || !["president", "secretary", "treasurer", "seal"].includes(role)) {
            return NextResponse.json({ message: "Invalid role or type specified" }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ message: "No file provided" }, { status: 400 });
        }

        const publicUrl = await saveUploadedFile(file, "uploads/signatures", role);
        const key = role === "seal" ? "official_seal_url" : `${role}_signature_url`;

        await prisma.setting.upsert({
            where: { key },
            update: { value: publicUrl },
            create: { key, value: publicUrl },
        });

        return NextResponse.json({
            message: `${role.toUpperCase()} uploaded successfully`,
            url: publicUrl,
            role,
        });
    } catch (error) {
        console.error("POST upload error:", error);
        return NextResponse.json({ message: "Failed to upload file" }, { status: 500 });
    }
}
