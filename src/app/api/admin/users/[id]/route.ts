import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
    getAuthedAdmin,
    getPermissionsForAdmin,
    savePermissionsForAdmin,
} from "@/lib/admin-auth";

/** Update permissions / name / password of an admin (Super Admin only). */
export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const me = await getAuthedAdmin(request);
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (me.role !== "SUPER_ADMIN") {
        return NextResponse.json({ message: "Only Super Admin can manage users." }, { status: 403 });
    }

    const { id } = await props.params;
    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));

    if (body.permissions && target.role !== "SUPER_ADMIN") {
        await savePermissionsForAdmin(id, body.permissions);
    }

    const data: { name?: string; password?: string } = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.password === "string" && body.password.length > 0) {
        if (body.password.length < 6) {
            return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
        }
        data.password = await bcrypt.hash(body.password, 10);
    }
    if (Object.keys(data).length > 0) {
        await prisma.admin.update({ where: { id }, data });
    }

    const updated = await prisma.admin.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, name: true, phone: true, whatsapp: true },
    });
    return NextResponse.json({
        user: { ...updated, permissions: await getPermissionsForAdmin(id, target.role) },
    });
}
