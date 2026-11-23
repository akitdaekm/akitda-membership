import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { getPermissionsForAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
    try {
        const { email: rawEmail, password, client } = await request.json();
        const email = typeof rawEmail === "string" ? rawEmail.trim() : rawEmail;

        if (!email || !password) {
            return NextResponse.json(
                { message: "Missing email or password" },
                { status: 400 }
            );
        }

        const admin = await prisma.admin.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
        });

        if (!admin) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        const isValid = await bcrypt.compare(password, admin.password);

        if (!isValid) {
            return NextResponse.json(
                { message: "Invalid credentials", role: admin.role, emailExists: true },
                { status: 401 }
            );
        }

        // Create JWT
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );
        const isMobile = client === "mobile";
        const token = await new SignJWT({ id: admin.id, email: admin.email, role: admin.role })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(isMobile ? "30d" : "24h")
            .sign(secret);

        if (isMobile) {
            // Mobile app: token returned in body and used as Bearer token
            return NextResponse.json({
                message: "Login successful",
                token,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    role: admin.role,
                    name: admin.name,
                    permissions: await getPermissionsForAdmin(admin.id, admin.role),
                },
            });
        }

        // Set Cookie
        (await cookies()).set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return NextResponse.json({ message: "Login successful" });
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
