import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { NotificationService } from "@/lib/notifications";
import { extractPdfText } from "@/lib/pdf-extract";

const COMPANY_STOP_WORDS = new Set([
    "PVT", "PRIVATE", "LTD", "LIMITED", "LLP", "INC", "CORP",
    "MS", "M/S", "CO", "COMPANY", "AND", "THE", "OF", "IN",
    "INDIA", "KERALA", "ENTERPRISE", "ENTERPRISES", "TRADERS",
    "SOLUTIONS", "SYSTEMS", "SERVICES", "TECHNOLOGIES", "ASSOCIATES",
]);

function verifyCompanyNameInPdf(companyName: string, normPdfText: string): boolean {
    const cleanCompany = companyName.toUpperCase().replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    const cleanPdf = normPdfText.replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ");

    if (!cleanCompany) return false;
    if (cleanPdf.includes(cleanCompany)) return true;

    const allWords = cleanCompany.split(" ").filter((w) => w.length >= 2);
    const significantWords = allWords.filter((w) => !COMPANY_STOP_WORDS.has(w));
    const wordsToCheck = significantWords.length > 0 ? significantWords : allWords;

    if (wordsToCheck.length === 0) return false;

    const matchedCount = wordsToCheck.filter((w) => cleanPdf.includes(w)).length;
    return matchedCount / wordsToCheck.length >= 0.6;
}

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

        // 2. Verify GST Certificate PDF (GSTIN + Company Name)
        const isPdf =
            gstFile.type === "application/pdf" ||
            gstFile.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            return NextResponse.json(
                { message: "Please upload your GST Registration Certificate in PDF format (downloaded from gst.gov.in)." },
                { status: 400 }
            );
        }

        const gstBuffer = Buffer.from(await gstFile.arrayBuffer());
        let pdfText = "";
        try {
            pdfText = await extractPdfText(gstBuffer);
        } catch (pdfErr) {
            console.error("GST PDF parse error:", pdfErr);
            return NextResponse.json(
                { message: "Could not read the uploaded GST PDF file. Please upload a valid GST Certificate PDF." },
                { status: 400 }
            );
        }

        const normPdfText = pdfText.toUpperCase().replace(/\s+/g, " ").trim();
        if (normPdfText.length < 30) {
            return NextResponse.json(
                { message: "The uploaded GST PDF appears to be a scanned image with no readable text. Please upload the original digital GST Certificate PDF downloaded from gst.gov.in." },
                { status: 400 }
            );
        }

        const compactPdfText = normPdfText.replace(/\s+/g, "");
        if (!compactPdfText.includes(cleanGst)) {
            return NextResponse.json(
                { message: `GST Number mismatch: "${cleanGst}" was not found in the uploaded GST Certificate PDF.` },
                { status: 400 }
            );
        }

        if (!verifyCompanyNameInPdf(cleanCompany, normPdfText)) {
            return NextResponse.json(
                { message: `Company Name mismatch: "${cleanCompany}" does not match the Legal/Trade Name in the uploaded GST Certificate PDF.` },
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
                member.companyName,
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
