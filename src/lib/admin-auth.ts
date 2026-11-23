import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export type AdminRole = "SUPER_ADMIN" | "PRESIDENT" | "SECRETARY" | "TREASURER";

export const PERMISSION_KEYS = [
    "viewMembers",
    "approveMembers",
    "activateMembers",
    "verifyPayments",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type Permissions = Record<PermissionKey, boolean>;

const ALL_ON: Permissions = {
    viewMembers: true,
    approveMembers: true,
    activateMembers: true,
    verifyPayments: true,
};

/** Default permissions for committee roles (before Super Admin customises them). */
const COMMITTEE_DEFAULTS: Permissions = { ...ALL_ON };

const SETTING_PREFIX = "admin_permissions:";

export function getJwtSecret() {
    return new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
}

export async function getPermissionsForAdmin(adminId: string, role: string): Promise<Permissions> {
    if (role === "SUPER_ADMIN") return { ...ALL_ON };

    try {
        const row = await prisma.setting.findUnique({ where: { key: `${SETTING_PREFIX}${adminId}` } });
        if (row?.value) {
            const parsed = JSON.parse(row.value);
            const result = { ...COMMITTEE_DEFAULTS };
            for (const key of PERMISSION_KEYS) {
                if (typeof parsed[key] === "boolean") result[key] = parsed[key];
            }
            return result;
        }
    } catch (err) {
        console.warn("[admin-auth] Could not read permissions, using defaults:", err);
    }
    return { ...COMMITTEE_DEFAULTS };
}

export async function savePermissionsForAdmin(adminId: string, permissions: Partial<Permissions>) {
    const clean: Partial<Permissions> = {};
    for (const key of PERMISSION_KEYS) {
        if (typeof permissions[key] === "boolean") clean[key] = permissions[key];
    }
    const current = await prisma.setting.findUnique({ where: { key: `${SETTING_PREFIX}${adminId}` } });
    let merged: Permissions = { ...COMMITTEE_DEFAULTS };
    if (current?.value) {
        try {
            merged = { ...merged, ...JSON.parse(current.value) };
        } catch {
            /* ignore corrupt value */
        }
    }
    merged = { ...merged, ...clean };
    await prisma.setting.upsert({
        where: { key: `${SETTING_PREFIX}${adminId}` },
        update: { value: JSON.stringify(merged) },
        create: { key: `${SETTING_PREFIX}${adminId}`, value: JSON.stringify(merged) },
    });
    return merged;
}

export interface AuthedAdmin {
    id: string;
    email: string;
    role: AdminRole;
    name: string | null;
    permissions: Permissions;
}

/**
 * Resolves the logged-in admin from either the web cookie (`admin_token`)
 * or a mobile `Authorization: Bearer <jwt>` header. Always re-reads the admin
 * from the DB so role / permission changes apply immediately.
 */
export async function getAuthedAdmin(request?: Request): Promise<AuthedAdmin | null> {
    let token: string | undefined;

    const authHeader = request?.headers.get("authorization");
    if (authHeader?.toLowerCase().startsWith("bearer ")) {
        token = authHeader.slice(7).trim();
    }
    if (!token) {
        token = (await cookies()).get("admin_token")?.value;
    }
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        const admin = await prisma.admin.findUnique({ where: { id: payload.id as string } });
        if (!admin) return null;
        return {
            id: admin.id,
            email: admin.email,
            role: admin.role as AdminRole,
            name: admin.name,
            permissions: await getPermissionsForAdmin(admin.id, admin.role),
        };
    } catch {
        return null;
    }
}
