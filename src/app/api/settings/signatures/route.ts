import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        console.error("GET public signatures error:", error);
        return NextResponse.json({
            presidentSignatureUrl: null,
            secretarySignatureUrl: null,
            treasurerSignatureUrl: null,
            officialSealUrl: null,
        });
    }
}
