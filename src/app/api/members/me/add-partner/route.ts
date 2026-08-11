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

        const action = formData.get("action"); // "add" or "update_photo"
        const partnerName = formData.get("name") as string;
        const partnerPhone = formData.get("phone") as string;
        const targetPartnerId = formData.get("partnerId") as string;
        const file = formData.get("file") as File | null;

        let photoUrl = null;

        if (file && file.size > 0 && file.name !== "undefined") {
            photoUrl = await saveUploadedFile(file, "uploads/partners", memberId);
        }

        if (action === "update_photo") {
            const otp = String(formData.get("otp") || "");
            const verification = await verifyAndClearOtp(memberId, otp);
            if (!verification.success) {
                return NextResponse.json({ message: verification.message }, { status: 400 });
            }

            if (!targetPartnerId) return NextResponse.json({ message: "Partner ID required" }, { status: 400 });
            if (!photoUrl) return NextResponse.json({ message: "Photo file required for updating" }, { status: 400 });

            const partner = await prisma.partner.findFirst({
                where: { id: targetPartnerId, memberId }
            });
            if (!partner) return NextResponse.json({ message: "Partner not found" }, { status: 404 });

            await prisma.partner.update({
                where: { id: targetPartnerId },
                data: { photoFile: photoUrl }
            });

            return NextResponse.json({ message: "Partner photo updated successfully", photoUrl });

        } else if (action === "add") {
            if (!partnerName) return NextResponse.json({ message: "Partner name is required" }, { status: 400 });

            await prisma.partner.create({
                data: {
                    name: partnerName,
                    phone: partnerPhone || null,
                    photoFile: photoUrl,
                    memberId: memberId
                }
            });

            return NextResponse.json({ message: "Partner added successfully" });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Partner action error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
