import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const dataJson = formData.get("data") as string;
        const gstFile = formData.get("gstFile") as File | null;
        // Old photoFile is removed.

        if (!dataJson || !gstFile) {
            return NextResponse.json(
                { message: "Missing required fields or files." },
                { status: 400 }
            );
        }

        const data = JSON.parse(dataJson);

        // Save files
        const uploadDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const saveFile = async (file: File, prefix: string) => {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `${prefix}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
            const filepath = join(uploadDir, filename);
            await writeFile(filepath, buffer);
            return `/uploads/${filename}`;
        };

        const gstPath = await saveFile(gstFile, "gst");

        // Handle Partner Photos
        const partnersWithPhotos = await Promise.all(data.partners.map(async (p: any, index: number) => {
            const photoFile = formData.get(`partnerPhoto_${index}`) as File | null;
            let photoPath = null;
            if (photoFile) {
                photoPath = await saveFile(photoFile, `partner_${index}`);
            }
            return {
                ...p,
                photoFile: photoPath
            };
        }));

        // Create Member
        const member = await prisma.member.create({
            data: {
                companyName: data.companyName,
                companyType: data.companyType,
                memberType: data.memberType,
                membershipId: data.membershipId || null, // Handle empty string as null for unique constraint
                addressBuilding: data.addressBuilding,
                addressArea: data.addressArea,
                district: data.district,
                unit: data.unit,
                pincode: data.pincode,
                primaryMobile: data.primaryMobile,
                primaryEmail: data.primaryEmail,
                gstNumber: data.gstNumber,
                gstFile: gstPath,
                // photoFile: photoPath, // Removed from Member
                status: "PENDING",
                partners: {
                    create: partnersWithPhotos.map((p: any) => ({
                        name: p.name,
                        phone: p.phone,
                        email: p.email || null,
                        photoFile: p.photoFile
                    })),
                },
            },
        });

        // Simulate Notifications
        try {
            const admins = await prisma.admin.findMany();
            admins.forEach(admin => {
                if (admin.phone) console.log(`[Notification] Would send SMS to ${admin.phone} (Admin: ${admin.role}) about new member ${member.companyName}.`);
                if (admin.whatsapp) console.log(`[Notification] Would send WhatsApp to ${admin.whatsapp} (Admin: ${admin.role}) about new member ${member.companyName}.`);
                console.log(`[Notification] Would send Email to ${admin.email} (Admin: ${admin.role}) about new member ${member.companyName}.`);
            });
        } catch (e) {
            console.error("Failed to send notifications:", e);
        }

        return NextResponse.json({ message: "Registration successful", memberId: member.id });
    } catch (error: any) {
        console.error("Registration error:", error);
        // Handle unique constraint violations
        if (error.code === "P2002") {
            return NextResponse.json(
                { message: "A member with this Mobile, Email, or GST already exists." },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { message: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
