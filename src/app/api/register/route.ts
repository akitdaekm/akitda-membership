import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const dataJson = formData.get("data") as string;
        const gstFile = formData.get("gstFile") as File | null;

        if (!dataJson || !gstFile) {
            return NextResponse.json(
                { message: "Missing required fields or files." },
                { status: 400 }
            );
        }

        const data = JSON.parse(dataJson);

        // Save GST Certificate File safely (Vercel serverless friendly)
        const gstPath = await saveUploadedFile(gstFile, "uploads", "gst");

        // Handle Partner Photos
        const partnersWithPhotos = await Promise.all(data.partners.map(async (p: any, index: number) => {
            const photoFile = formData.get(`partnerPhoto_${index}`) as File | null;
            let photoPath = null;
            if (photoFile) {
                photoPath = await saveUploadedFile(photoFile, "uploads/partners", `partner_${index}`);
            }
            return {
                ...p,
                photoFile: photoPath
            };
        }));

        // Create Member in Database
        const member = await prisma.member.create({
            data: {
                companyName: data.companyName,
                companyType: data.companyType,
                memberType: data.memberType,
                membershipId: data.membershipId || null,
                addressBuilding: data.addressBuilding,
                addressArea: data.addressArea,
                district: data.district,
                unit: data.unit,
                pincode: data.pincode,
                primaryMobile: data.primaryMobile,
                primaryEmail: data.primaryEmail,
                gstNumber: data.gstNumber,
                gstFile: gstPath,
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

        return NextResponse.json({ message: "Registration successful", memberId: member.id });
    } catch (error: any) {
        console.error("Registration error:", error);
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
