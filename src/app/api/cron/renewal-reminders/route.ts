import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        // Simple security check to prevent unauthorized execution
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        // In a real app, use a strong, secret token stored in env variables
        const CRON_SECRET = process.env.CRON_SECRET || "default_dev_cron_secret";

        if (token !== CRON_SECRET) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Calculate the target date: Exactly 30 days from now
        const today = new Date();
        const targetDateStart = new Date(today);
        targetDateStart.setDate(today.getDate() + 30);
        targetDateStart.setHours(0, 0, 0, 0);

        const targetDateEnd = new Date(targetDateStart);
        targetDateEnd.setHours(23, 59, 59, 999);

        // Find members whose validUntil falls within the target date
        const expiringMembers = await prisma.member.findMany({
            where: {
                status: "ACTIVE",
                validUntil: {
                    gte: targetDateStart,
                    lte: targetDateEnd,
                }
            },
            select: {
                id: true,
                companyName: true,
                primaryMobile: true,
                validUntil: true,
            }
        });

        if (expiringMembers.length === 0) {
            return NextResponse.json({ message: "No members expiring in exactly 30 days." });
        }

        // =========================================================================
        // MOCK WHATSAPP INTEGRATION
        // =========================================================================
        // In a real application, you would iterate over `expiringMembers` and 
        // call your WhatsApp Business API provider (e.g., Twilio, Wati) to send
        // a template message.

        console.log(`\n=============================================================`);
        console.log(`📱 WHATSAPP RENEWAL REMINDER CRON JOB EXECUTED`);
        console.log(`Found ${expiringMembers.length} members expiring on ${targetDateStart.toDateString()}`);
        console.log(`=============================================================`);

        for (const member of expiringMembers) {
            const expiryDate = member.validUntil?.toLocaleDateString() || "Unknown";
            const message = `Hello ${member.companyName},\n\n This is a gentle reminder from AKITDA that your membership is due for renewal on ${expiryDate}. Please login to your portal to complete the payment and avoid any interruption in your membership benefits.\n\nThank you!`;

            console.log(`\n---> Sending WhatsApp to ${member.primaryMobile} for ${member.companyName}`);
            console.log(`Message: "${message}"`);
        }
        console.log(`\n=============================================================\n`);

        return NextResponse.json({
            message: `Successfully processed ${expiringMembers.length} renewal reminders.`,
            processedCount: expiringMembers.length
        });

    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
