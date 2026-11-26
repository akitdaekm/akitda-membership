import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SETTING_KEY = "member_document_visibility";

export interface DocumentVisibilitySettings {
    showIdCard: boolean;
    showCertificate: boolean;
    showTaxInvoice: boolean;
    showReceipt: boolean;
}

const DEFAULT_SETTINGS: DocumentVisibilitySettings = {
    showIdCard: false,
    showCertificate: true,
    showTaxInvoice: true,
    showReceipt: true,
};

export async function GET() {
    try {
        const record = await prisma.setting.findUnique({
            where: { key: SETTING_KEY },
        });
        if (!record) {
            return NextResponse.json(DEFAULT_SETTINGS);
        }
        const parsed = JSON.parse(record.value);
        return NextResponse.json({
            showIdCard: parsed.showIdCard ?? false,
            showCertificate: parsed.showCertificate ?? true,
            showTaxInvoice: parsed.showTaxInvoice ?? true,
            showReceipt: parsed.showReceipt ?? true,
        });
    } catch (error) {
        console.error("Failed to fetch document settings:", error);
        return NextResponse.json(DEFAULT_SETTINGS);
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
        const { payload } = await jwtVerify(token.value, secret);
        if (payload.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { message: "Only Super Admin can update document visibility settings." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const settings: DocumentVisibilitySettings = {
            showIdCard: Boolean(body.showIdCard),
            showCertificate: Boolean(body.showCertificate),
            showTaxInvoice: Boolean(body.showTaxInvoice),
            showReceipt: Boolean(body.showReceipt),
        };

        await prisma.setting.upsert({
            where: { key: SETTING_KEY },
            update: { value: JSON.stringify(settings) },
            create: { key: SETTING_KEY, value: JSON.stringify(settings) },
        });

        return NextResponse.json({ message: "Document visibility updated.", settings });
    } catch (error) {
        console.error("Failed to update document settings:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
