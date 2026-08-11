import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );

        const { payload } = await jwtVerify(token.value, secret);

        // Fetch fresh data from DB to get profile updates
        const admin = await prisma.admin.findUnique({
            where: { id: payload.id as string },
            select: { id: true, email: true, role: true, name: true, phone: true, whatsapp: true }
        });

        if (!admin) return NextResponse.json({ message: "Admin not found" }, { status: 404 });

        return NextResponse.json(admin);

    } catch (error) {
        return NextResponse.json(
            { message: "Invalid token" },
            { status: 401 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );

        const { payload } = await jwtVerify(token.value, secret);
        const id = payload.id as string;

        const body = await request.json();
        const { name, phone, whatsapp, email } = body;

        // Validation (basic)
        if (email && !email.includes("@")) {
            return NextResponse.json({ message: "Invalid email" }, { status: 400 });
        }

        const updatedAdmin = await prisma.admin.update({
            where: { id },
            data: {
                name,
                phone,
                whatsapp,
                email, // Allow updating email too
            },
            select: { id: true, email: true, role: true, name: true, phone: true, whatsapp: true }
        });

        return NextResponse.json(updatedAdmin);

    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
