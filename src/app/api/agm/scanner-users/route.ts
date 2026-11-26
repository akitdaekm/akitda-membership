import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthedAdmin } from "@/lib/admin-auth";
import { getScannerUsers, saveScannerUsers } from "@/lib/agm-auth";

export async function GET(request: Request) {
    const admin = await getAuthedAdmin(request);
    if (!admin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const users = await getScannerUsers();
    return NextResponse.json({
        users: users.map((u) => ({
            username: u.username,
            label: u.label || "Scanner",
            createdAt: u.createdAt,
        })),
    });
}

export async function POST(request: Request) {
    const admin = await getAuthedAdmin(request);
    if (!admin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const username = String(body.username || "").trim().toLowerCase();
        const password = String(body.password || "");
        const label = String(body.label || "Scanner Station").trim();

        if (!username || username.length < 3 || !/^[a-z0-9_.-]+$/.test(username)) {
            return NextResponse.json(
                { message: "Username must be at least 3 characters (letters, numbers, _, ., -)." },
                { status: 400 }
            );
        }
        if (!password || password.length < 4) {
            return NextResponse.json(
                { message: "Password must be at least 4 characters." },
                { status: 400 }
            );
        }

        const users = await getScannerUsers();
        const passwordHash = await bcrypt.hash(password, 10);
        const existingIdx = users.findIndex((u) => u.username.toLowerCase() === username);

        if (existingIdx >= 0) {
            users[existingIdx] = {
                ...users[existingIdx],
                passwordHash,
                label,
            };
        } else {
            users.push({
                username,
                passwordHash,
                label,
                createdAt: new Date().toISOString(),
            });
        }

        await saveScannerUsers(users);
        return NextResponse.json({ status: "success", username });
    } catch (error) {
        console.error("Save scanner user error:", error);
        return NextResponse.json({ message: "Failed to save scanner user" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const admin = await getAuthedAdmin(request);
    if (!admin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = (searchParams.get("username") || "").trim().toLowerCase();
    if (!username) {
        return NextResponse.json({ message: "Username is required" }, { status: 400 });
    }

    const users = await getScannerUsers();
    const filtered = users.filter((u) => u.username.toLowerCase() !== username);
    if (filtered.length === 0) {
        return NextResponse.json({ message: "At least one scanner user must remain." }, { status: 400 });
    }
    await saveScannerUsers(filtered);
    return NextResponse.json({ status: "success" });
}
