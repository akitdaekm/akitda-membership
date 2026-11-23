import { prisma } from "@/lib/prisma";

const DEFAULT_LOCAL_GATEWAY = "http://127.0.0.1:8085";

/**
 * Resolves the active Baileys WhatsApp gateway URL.
 * Prefers an explicit non-tunnel WHATSAPP_API_URL env var or a live local
 * gateway on 127.0.0.1:8085 (Hostinger VPS PM2 setup) before falling back
 * to the database Setting table.
 */
export async function resolveWhatsAppGatewayUrl(): Promise<string> {
    const envUrl = process.env.WHATSAPP_API_URL?.trim();

    if (envUrl && !envUrl.includes("trycloudflare.com")) {
        return envUrl.replace(/\/+$/, "");
    }

    // Probe local PM2 wa-server (akitda-wa) on the same VPS
    try {
        const healthRes = await fetch(`${DEFAULT_LOCAL_GATEWAY}/health`, {
            method: "GET",
            signal: AbortSignal.timeout(1500),
        });
        if (healthRes.ok) {
            return DEFAULT_LOCAL_GATEWAY;
        }
    } catch {
        // Local wa-server not reachable; fall back to DB setting
    }

    try {
        const dbSetting = await prisma.setting.findUnique({
            where: { key: "WHATSAPP_API_URL" },
        });
        if (dbSetting?.value && dbSetting.value.startsWith("http")) {
            return dbSetting.value.trim().replace(/\/+$/, "");
        }
    } catch (dbErr) {
        console.warn("[WhatsApp Gateway] Could not fetch WHATSAPP_API_URL from Setting table:", dbErr);
    }

    return envUrl ? envUrl.replace(/\/+$/, "") : DEFAULT_LOCAL_GATEWAY;
}
