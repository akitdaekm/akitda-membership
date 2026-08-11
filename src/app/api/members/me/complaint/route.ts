import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("member_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );

        const { payload } = await jwtVerify(token.value, secret);
        const memberId = payload.id as string;

        const body = await request.json();
        const { subject, message, attachments } = body;

        if (!subject || !message) {
            return NextResponse.json({ message: "Subject and message are required." }, { status: 400 });
        }

        const member = await prisma.member.findUnique({
            where: { id: memberId },
            select: {
                primaryEmail: true,
                companyName: true,
                primaryMobile: true,
            }
        });

        if (!member) {
            return NextResponse.json({ message: "Member not found." }, { status: 404 });
        }

        // Configure Nodemailer Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER || "dummy@example.com",
                pass: process.env.SMTP_PASS || "dummy_password",
            },
        });

        const targetEmails = ["complaintcellekm@akitda.co.in", "gsekm@akitda.co.in"];

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.SMTP_FROM_EMAIL || `"AKITDA Portal" <noreply@akitda.co.in>`,
            replyTo: member.primaryEmail,
            to: targetEmails.join(","),
            subject: `AKITDA Member Complaint: ${subject}`,
            text: `
A new complaint has been registered by an AKITDA Member.

Company Name: ${member.companyName}
Contact Email: ${member.primaryEmail}
Contact Phone: ${member.primaryMobile}

Complaint Subject:
${subject}

Message Details:
${message}

-----------------------------------------
This message was sent from the AKITDA Membership Dashboard.
            `,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
                    <h2 style="color: #d32f2f;">New AKITDA Member Complaint</h2>
                    <p><strong>Company Name:</strong> ${member.companyName}</p>
                    <p><strong>Contact Email:</strong> <a href="mailto:${member.primaryEmail}">${member.primaryEmail}</a></p>
                    <p><strong>Contact Phone:</strong> ${member.primaryMobile}</p>
                    <hr />
                    <h3 style="color: #333;">Subject: ${subject}</h3>
                    <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #d32f2f;">${message}</p>
                    <br />
                    <p style="font-size: 12px; color: #777;">This message was generated automatically from the AKITDA Membership Dashboard.</p>
                </div>
            `
        };

        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            mailOptions.attachments = attachments.map((att: { base64Data: string; fileName: string; mimeType: string }) => {
                const base64Data = att.base64Data.split(",")[1];
                return {
                    filename: att.fileName,
                    content: base64Data || att.base64Data, // Fallback if no comma
                    encoding: "base64",
                    contentType: att.mimeType || "application/octet-stream"
                };
            });
        }

        // Check if real SMTP credentials exist before attempting to send to avoid hard crashes in dev
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail(mailOptions);
            console.log(`[Complaint API] Email sent to ${targetEmails.join(", ")}`);
        } else {
            console.log(`[Complaint API] SMTP Auth not configured in .env. Here is the mock payload:`);
            console.log(mailOptions);
        }

        return NextResponse.json({ message: "Complaint sent successfully." }, { status: 200 });

    } catch (error) {
        console.error("[Complaint API] Error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
