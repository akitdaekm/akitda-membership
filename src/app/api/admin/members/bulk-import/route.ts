import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        // Authenticate Super Admin
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token");
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_dev_only");
        const { payload } = await jwtVerify(token.value, secret);

        if (payload.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const membersToImport = await request.json();

        if (!Array.isArray(membersToImport) || membersToImport.length === 0) {
            return NextResponse.json({ message: "No data provided" }, { status: 400 });
        }

        let importedCount = 0;
        let skippedCount = 0;

        for (const row of membersToImport) {
            const { companyName, memberName, mobile } = row;

            // Skip if critical fields are missing
            if (!companyName || !mobile) {
                skippedCount++;
                continue;
            }

            // Convert mobile to string just in case it was parsed as a number by Excel
            const mobileStr = String(mobile).trim();

            // Check if mobile already exists in DB
            const existingMember = await prisma.member.findUnique({
                where: { primaryMobile: mobileStr }
            });

            if (existingMember) {
                skippedCount++;
                continue; // Skip duplicates silently
            }

            // Generate unique placeholders that satisfy Prisma schema
            const placeholderEmail = `pending_${mobileStr}_${Date.now()}@akitda.com`;
            const placeholderGst = `PENDING_GST_${mobileStr}`;

            // Create Member
            const newMember = await prisma.member.create({
                data: {
                    companyName: companyName.trim(),
                    companyType: "OTHER", // Placeholder
                    memberType: "EXISTING",
                    addressBuilding: "To be updated by user", // Placeholder
                    addressArea: "To be updated", // Placeholder
                    primaryMobile: mobileStr,
                    primaryEmail: placeholderEmail,
                    gstNumber: placeholderGst,
                    status: "PROFILE_PENDING", // PENDING PROFILE completion from user
                }
            });

            // Create Partner (Member Name / Owner)
            if (memberName) {
                await prisma.partner.create({
                    data: {
                        name: memberName.trim(),
                        memberId: newMember.id
                    }
                });
            }

            importedCount++;
        }

        return NextResponse.json({
            message: `Successfully imported ${importedCount} members. Skipped ${skippedCount} duplicate or invalid rows.`
        });

    } catch (error) {
        console.error("[Bulk Import] Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
