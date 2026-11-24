import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { verifyAndClearOtp } from "@/lib/otp";
import { saveUploadedFile } from "@/lib/upload";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        let tokenValue = cookieStore.get("member_token")?.value;

        if (!tokenValue) {
            const authHeader = request.headers.get("Authorization");
            if (authHeader && authHeader.startsWith("Bearer ")) {
                tokenValue = authHeader.split(" ")[1];
            }
        }

        if (!tokenValue) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
        const { payload } = await jwtVerify(tokenValue, secret);
        const memberId = payload.id as string;

        const formData = await request.formData();
        const type = formData.get("type"); // "gst", "profile", or "partner_photo"
        const partnerId = String(formData.get("partnerId") || "");

        if (!type || (type !== "gst" && type !== "profile" && type !== "partner_photo")) {
            return NextResponse.json({ message: "Invalid type" }, { status: 400 });
        }

        const member = await prisma.member.findUnique({ where: { id: memberId } });

        const requiresOtp =
            type === "profile" ||
            type === "partner_photo" ||
            (type === "gst" && member?.memberType === "EXISTING");

        if (requiresOtp) {
            const otp = String(formData.get("otp") || "");
            const verification = await verifyAndClearOtp(memberId, otp);
            if (!verification.success) {
                return NextResponse.json({ message: verification.message }, { status: 400 });
            }
        }

        const file = formData.get("file") as File | null;
        if (!file || file.size === 0 || file.name === "undefined") {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        if (type === "partner_photo") {
            if (!partnerId) {
                return NextResponse.json({ message: "Partner ID is required" }, { status: 400 });
            }
            const partner = await prisma.partner.findFirst({
                where: { id: partnerId, memberId },
            });
            if (!partner) {
                return NextResponse.json({ message: "Partner not found" }, { status: 404 });
            }
            const publicUrl = await saveUploadedFile(file, "uploads/partners", partnerId);
            await prisma.partner.update({
                where: { id: partnerId },
                data: { photoFile: publicUrl },
            });
            return NextResponse.json({ message: "Partner photo updated successfully", url: publicUrl });
        }

        const publicUrl = await saveUploadedFile(file, `uploads/${type}`, memberId);

        if (type === "gst") {
            await prisma.member.update({
                where: { id: memberId },
                data: { gstFile: publicUrl }
            });
        } else if (type === "profile") {
            await prisma.member.update({
                where: { id: memberId },
                data: { profilePhoto: publicUrl }
            });
        }

        return NextResponse.json({ message: "Upload successful", url: publicUrl });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ message: `Internal server error: ${error?.message || String(error)}` }, { status: 500 });
    }
}
