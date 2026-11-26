import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { resolveWhatsAppGatewayUrl } from "@/lib/whatsapp-gateway";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const passId = String(body.passId || "").trim();

        if (!passId) {
            return NextResponse.json(
                { status: "error", message: "Pass ID is required." },
                { status: 400 }
            );
        }

        const reg = await prisma.agmRegistration.findFirst({
            where: { passId: { equals: passId, mode: "insensitive" } },
        });

        if (!reg) {
            return NextResponse.json(
                { status: "error", message: "Registration not found." },
                { status: 404 }
            );
        }

        const qrDataUrl = await QRCode.toDataURL(reg.qrPayload, {
            width: 480,
            margin: 2,
            color: { dark: "#0f172a", light: "#ffffff" },
        });
        const imageBase64 = qrDataUrl.replace(/^data:image\/\w+;base64,/, "");

        const caption = [
            `*AKITDA General Body Meeting 2026*`,
            `Ernakulam District Committee • 15th December 2026`,
            ``,
            `*Pass ID:* ${reg.passId}`,
            `*Name:* ${reg.name}`,
            `*Company:* ${reg.company}`,
            `*Designation:* ${reg.designation}`,
            `*District:* ${reg.district}`,
            ``,
            `Please present this QR code at the venue registration desk.`,
        ].join("\n");

        const apiUrl = await resolveWhatsAppGatewayUrl();
        const apiKey = process.env.WHATSAPP_API_KEY || "my_secret_key_123";

        const waRes = await fetch(`${apiUrl}/api/sendText`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                api_key: apiKey,
            },
            body: JSON.stringify({
                to: reg.phone,
                content: caption,
                imageBase64,
            }),
            signal: AbortSignal.timeout(15000),
        });

        const waData = await waRes.json().catch(() => ({}));
        if (!waRes.ok) {
            return NextResponse.json(
                {
                    status: "error",
                    message: waData.error || "Failed to send QR pass via WhatsApp.",
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            status: "success",
            message: `QR Pass sent to WhatsApp (${reg.phone}).`,
        });
    } catch (error: any) {
        console.error("AGM WhatsApp send error:", error);
        return NextResponse.json(
            {
                status: "error",
                message: error?.message || "Could not send QR pass to WhatsApp.",
            },
            { status: 500 }
        );
    }
}
