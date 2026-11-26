import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { NotificationService, formatMemberGreeting } from "@/lib/notifications";

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
        const cleanCompany = (data.companyName || "").trim().replace(/\s+/g, " ");
        const cleanEmail = (data.primaryEmail || "").trim().toLowerCase();
        const cleanGst = (data.gstNumber || "").trim().toUpperCase();
        const rawMobileDigits = (data.primaryMobile || "").replace(/\D/g, "");
        const cleanMobile10 = rawMobileDigits.slice(-10);

        if (!cleanCompany || !cleanEmail || !cleanGst || cleanMobile10.length !== 10) {
            return NextResponse.json(
                { message: "Please provide valid Company Name, 10-digit Mobile Number, Email, and GST Number." },
                { status: 400 }
            );
        }

        // 1. Check for duplicate Company Name, Mobile, Email, or GST Number
        const existingMember = await prisma.member.findFirst({
            where: {
                OR: [
                    { companyName: { equals: cleanCompany, mode: "insensitive" } },
                    { primaryEmail: { equals: cleanEmail, mode: "insensitive" } },
                    { gstNumber: { equals: cleanGst, mode: "insensitive" } },
                    { primaryMobile: { endsWith: cleanMobile10 } },
                ],
            },
            select: {
                companyName: true,
                primaryEmail: true,
                gstNumber: true,
                primaryMobile: true,
            },
        });

        if (existingMember) {
            if (existingMember.companyName.toLowerCase() === cleanCompany.toLowerCase()) {
                return NextResponse.json(
                    { message: `A member with Company Name "${cleanCompany}" is already registered.` },
                    { status: 409 }
                );
            }
            if (existingMember.primaryMobile.replace(/\D/g, "").endsWith(cleanMobile10)) {
                return NextResponse.json(
                    { message: "This Mobile Number is already registered with another member." },
                    { status: 409 }
                );
            }
            if (existingMember.primaryEmail.toLowerCase() === cleanEmail) {
                return NextResponse.json(
                    { message: "This Email address is already registered with another member." },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { message: "This GST Number is already registered with another member." },
                { status: 409 }
            );
        }

        // 2. Validate GST Certificate file type (PDF or Image; admin verifies manually)
        const fileName = gstFile.name.toLowerCase();
        const isAllowedFile =
            gstFile.type === "application/pdf" ||
            gstFile.type.startsWith("image/") ||
            /\.(pdf|png|jpe?g|webp|gif|bmp)$/i.test(fileName);

        if (!isAllowedFile || gstFile.size === 0) {
            return NextResponse.json(
                { message: "Please upload a valid GST Certificate in PDF or image format." },
                { status: 400 }
            );
        }

        // 3. Save GST Certificate File & Partner Photos
        const gstPath = await saveUploadedFile(gstFile, "uploads", "gst");

        const partnersWithPhotos = await Promise.all(
            data.partners.map(async (p: any, index: number) => {
                const photoFile = formData.get(`partnerPhoto_${index}`) as File | null;
                let photoPath = null;
                if (photoFile) {
                    photoPath = await saveUploadedFile(photoFile, "uploads/partners", `partner_${index}`);
                }
                return {
                    ...p,
                    photoFile: photoPath,
                };
            })
        );

        // 4. Create Member in Database
        const member = await prisma.member.create({
            data: {
                companyName: cleanCompany,
                companyType: data.companyType,
                memberType: data.memberType,
                membershipId: data.membershipId || null,
                addressBuilding: data.addressBuilding,
                addressArea: data.addressArea,
                district: data.district,
                unit: data.unit,
                pincode: data.pincode,
                primaryMobile: data.primaryMobile.trim(),
                primaryEmail: cleanEmail,
                gstNumber: cleanGst,
                gstFile: gstPath,
                status: "PENDING",
                partners: {
                    create: partnersWithPhotos.map((p: any) => ({
                        name: p.name,
                        phone: p.phone,
                        email: p.email || null,
                        photoFile: p.photoFile,
                    })),
                },
            },
        });

        // 5. Send Welcome message via WhatsApp & Email
        try {
            await NotificationService.sendWelcome(
                formatMemberGreeting(partnersWithPhotos[0]?.name, member.companyName),
                member.primaryMobile,
                member.primaryEmail
            );
        } catch (notifyErr) {
            console.warn("Welcome notification failed:", notifyErr);
        }

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
