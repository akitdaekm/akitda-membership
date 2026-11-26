import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getJwtSecret } from "@/lib/admin-auth";
import { getAgmAuth, getScannerUsers, SCANNER_COOKIE_NAME } from "@/lib/agm-auth";

export async function GET(request: Request) {
    const auth = await getAgmAuth(request);
    if (!auth) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, kind: auth.kind, username: auth.username });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const username = String(body.username || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!username || !password) {
            return NextResponse.json({ message: "Username and password are required." }, { status: 400 });
        }

        const users = await getScannerUsers();
        const user = users.find((u) => u.username.toLowerCase() === username);
        if (!user) {
            return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
        }

        const token = await new SignJWT({ role: "AGM_SCANNER", username: user.username })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h")
            .sign(getJwtSecret());

        const res = NextResponse.json({
            status: "success",
            username: user.username,
            kind: "SCANNER",
        });

        res.cookies.set(SCANNER_COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        return res;
    } catch (error) {
        console.error("Scanner login error:", error);
        return NextResponse.json({ message: "Login failed" }, { status: 500 });
    }
}

export async function DELETE() {
    const res = NextResponse.json({ status: "success" });
    res.cookies.delete(SCANNER_COOKIE_NAME);
    return res;
}
