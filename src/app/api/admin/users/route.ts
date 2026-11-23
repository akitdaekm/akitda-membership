import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthedAdmin, getPermissionsForAdmin } from "@/lib/admin-auth";

const ASSIGNABLE_ROLES = ["PRESIDENT", "SECRETARY", "TREASURER"];

/** List all admin accounts with their permissions (Super Admin only). */
export async function GET(request: Request) {
    const me = await getAuthedAdmin(request);
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (me.role !== "SUPER_ADMIN") {
        return NextResponse.json({ message: "Only Super Admin can manage users." }, { status: 403 });
    }

    const admins = await prisma.admin.findMany({
        orderBy: { email: "asc" },
        select: { id: true, email: true, role: true, name: true, phone: true, whatsapp: true },
    });

    const users = await Promise.all(
        admins.map(async (a) => ({ ...a, permissions: await getPermissionsForAdmin(a.id, a.role) }))
    );
    return NextResponse.json({ users });
}

/** Create a committee login (Super Admin only). */
export async function POST(request: Request) {
    const me = await getAuthedAdmin(request);
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (me.role !== "SUPER_ADMIN") {
        return NextResponse.json({ message: "Only Super Admin can manage users." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "");
    const name = body.name ? String(body.name).trim() : null;

    if (!email.includes("@")) {
        return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
    }
    if (password.length < 6) {
        return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!ASSIGNABLE_ROLES.includes(role)) {
        return NextResponse.json({ message: "Role must be PRESIDENT, SECRETARY or TREASURER." }, { status: 400 });
    }

    const exists = await prisma.admin.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (exists) {
        return NextResponse.json({ message: "An admin with this email already exists." }, { status: 409 });
    }

    const created = await prisma.admin.create({
        data: { email, password: await bcrypt.hash(password, 10), role, name },
        select: { id: true, email: true, role: true, name: true },
    });
    return NextResponse.json({ user: { ...created, permissions: await getPermissionsForAdmin(created.id, created.role) } });
}
