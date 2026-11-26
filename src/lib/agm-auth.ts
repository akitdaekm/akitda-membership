import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthedAdmin, getJwtSecret } from "@/lib/admin-auth";

const SCANNER_USERS_KEY = "agm_scanner_users";
export const SCANNER_COOKIE_NAME = "agm_scanner_token";

export interface StoredScannerUser {
    username: string;
    passwordHash: string;
    label?: string;
    createdAt: string;
}

export type AgmAuthResult =
    | { kind: "ADMIN"; username: string }
    | { kind: "SCANNER"; username: string };

export async function getScannerUsers(): Promise<StoredScannerUser[]> {
    const row = await prisma.setting.findUnique({ where: { key: SCANNER_USERS_KEY } });
    if (row?.value) {
        try {
            const parsed = JSON.parse(row.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch {
            // fall through to seed default
        }
    }

    // Seed default scanner account if none exists
    const defaultUser: StoredScannerUser = {
        username: "scanner",
        passwordHash: await bcrypt.hash("akitda2026", 10),
        label: "Registration Desk Scanner",
        createdAt: new Date().toISOString(),
    };
    await prisma.setting.upsert({
        where: { key: SCANNER_USERS_KEY },
        update: { value: JSON.stringify([defaultUser]) },
        create: { key: SCANNER_USERS_KEY, value: JSON.stringify([defaultUser]) },
    });
    return [defaultUser];
}

export async function saveScannerUsers(users: StoredScannerUser[]): Promise<void> {
    await prisma.setting.upsert({
        where: { key: SCANNER_USERS_KEY },
        update: { value: JSON.stringify(users) },
        create: { key: SCANNER_USERS_KEY, value: JSON.stringify(users) },
    });
}

export async function getAgmAuth(request: Request): Promise<AgmAuthResult | null> {
    const admin = await getAuthedAdmin(request);
    if (admin) {
        return { kind: "ADMIN", username: admin.email };
    }

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SCANNER_COOKIE_NAME)?.value;
        if (!token) return null;

        const { payload } = await jwtVerify(token, getJwtSecret());
        if (payload.role === "AGM_SCANNER" && typeof payload.username === "string") {
            return { kind: "SCANNER", username: payload.username };
        }
    } catch {
        return null;
    }
    return null;
}
