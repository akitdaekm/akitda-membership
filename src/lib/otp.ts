import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

/**
 * Generate a 6-digit random OTP and save to database with 10-minute expiry
 */
export async function generateAndSaveOtp(identifier: string) {
    const member = await prisma.member.findFirst({
        where: {
            OR: [
                { id: identifier },
                { primaryMobile: identifier },
                { primaryEmail: identifier },
                { membershipId: identifier },
            ],
        },
    });

    if (!member) {
        return { success: false, message: "Member not found. Please register first." };
    }

    if (member.status !== "APPROVED" && member.status !== "ACTIVE") {
        return { success: false, message: `Your membership status is ${member.status}. You cannot login yet.` };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save to Database
    await prisma.member.update({
        where: { id: member.id },
        data: {
            otp,
            otpExpiry,
        },
    });

    // Dispatch WhatsApp, Email and SMS asynchronously
    const [waResult, emailResult, smsResult] = await Promise.all([
        sendOtpWhatsApp(member.primaryMobile, otp, member.companyName),
        sendOtpEmail(member.primaryEmail, otp, member.companyName),
        sendOtpSms(member.primaryMobile, otp),
    ]);

    return {
        success: true,
        message: "OTP sent successfully via WhatsApp, Email, and SMS.",
        waStatus: waResult,
        emailStatus: emailResult,
        smsStatus: smsResult,
    };
}

/**
 * Verify OTP from database and clear it upon successful verification
 */
export async function verifyAndClearOtp(identifier: string, inputOtp: string) {
    const member = await prisma.member.findFirst({
        where: {
            OR: [
                { id: identifier },
                { primaryMobile: identifier },
                { primaryEmail: identifier },
                { membershipId: identifier },
            ],
        },
    });

    if (!member) {
        return { success: false, message: "Member not found" };
    }

    if (!member.otp || !member.otpExpiry) {
        return { success: false, message: "No OTP was requested for this account." };
    }

    if (new Date() > member.otpExpiry) {
        return { success: false, message: "OTP has expired. Please request a new one." };
    }

    if (member.otp !== inputOtp) {
        return { success: false, message: "Invalid OTP. Please check and try again." };
    }

    // OTP is valid! Clear OTP to prevent re-use
    await prisma.member.update({
        where: { id: member.id },
        data: {
            otp: null,
            otpExpiry: null,
        },
    });

    return { success: true, member };
}

/**
 * Send OTP via Email using Nodemailer
 */
export async function sendOtpEmail(email: string, otp: string, companyName?: string) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `"AKITDA" <${user}>`;

    if (!host || !user || !pass) {
        console.warn("[Email OTP Warning] SMTP credentials not set in .env file (SMTP_HOST, SMTP_USER, SMTP_PASS). Email sending skipped.");
        return { sent: false, reason: "SMTP credentials missing in .env" };
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 10px;">
                <h2 style="color: #1e3a8a; text-align: center;">AKITDA Membership Portal</h2>
                <p>Hello <strong>${companyName || "Member"}</strong>,</p>
                <p>Your One-Time Password (OTP) for login verification is:</p>
                <div style="background: #1e3a8a; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 13px;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px; text-align: center;">All Kerala IT Dealers Association (AKITDA)</p>
            </div>
        `;

        await transporter.sendMail({
            from,
            to: email,
            subject: `${otp} is your AKITDA Verification Code`,
            html,
        });

        return { sent: true };
    } catch (error) {
        console.error("[Email OTP Error]:", error);
        return { sent: false, error: String(error) };
    }
}

/**
 * Send OTP via SMS API (Fast2SMS / 2Factor / MSG91 / Twilio / Custom HTTP)
 */
export async function sendOtpSms(mobile: string, otp: string) {
    const apiKey = process.env.SMS_API_KEY;
    const provider = process.env.SMS_PROVIDER || "FAST2SMS"; // FAST2SMS, 2FACTOR, MSG91, TWILIO, CUSTOM

    if (!apiKey) {
        console.warn("[SMS OTP Warning] SMS_API_KEY not configured in .env file. SMS sending skipped.");
        return { sent: false, reason: "SMS_API_KEY missing in .env" };
    }

    try {
        let url = "";
        let options: RequestInit = { method: "GET" };

        if (provider === "FAST2SMS") {
            url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otp}&numbers=${mobile}`;
        } else if (provider === "2FACTOR") {
            url = `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/${otp}/AUTOGEN`;
        } else if (provider === "MSG91") {
            url = `https://control.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=91${mobile}&authkey=${apiKey}`;
            options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp }),
            };
        } else if (provider === "CUSTOM" && process.env.SMS_API_URL) {
            url = process.env.SMS_API_URL.replace("{mobile}", mobile).replace("{otp}", otp).replace("{key}", apiKey);
        }

        if (url) {
            const res = await fetch(url, options);
            const data = await res.json();
            return { sent: res.ok, data };
        }

        return { sent: false, reason: "Unsupported SMS Provider" };
    } catch (error) {
        console.error("[SMS OTP Error]:", error);
        return { sent: false, error: String(error) };
    }
}

/**
 * Send OTP via WhatsApp (Open-WA / Baileys / Cloudflare Tunnel / UltraMsg / Custom API)
 */
export async function sendOtpWhatsApp(mobile: string, otp: string, companyName?: string) {
    const apiUrl = process.env.WHATSAPP_API_URL || "https://couple-integrate-feelings-thinkpad.trycloudflare.com";
    const apiKey = process.env.WHATSAPP_API_KEY || "my_secret_key_123";

    if (!apiUrl) {
        console.warn("[WhatsApp OTP Warning] WHATSAPP_API_URL not configured. WhatsApp dispatch skipped.");
        return { sent: false, reason: "WHATSAPP_API_URL not configured in environment" };
    }

    // Standardize 10-digit mobile number for WhatsApp JID
    let cleanMobile = mobile.replace(/[^0-9]/g, "");
    if (cleanMobile.length === 10) {
        cleanMobile = `91${cleanMobile}`;
    }

    const message = `*AKITDA Verification Code*\n\nHello ${companyName || "Member"},\nYour One-Time Password (OTP) for login verification is:\n\n*${otp}*\n\nThis OTP is valid for 10 minutes. Do not share this code with anyone.\n\n_All Kerala IT Dealers Association (AKITDA)_`;

    try {
        const trimmedUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
        // Supports Open-WA standard /api/sendText or custom endpoint
        const endpoint = trimmedUrl.includes("/api/") ? trimmedUrl : `${trimmedUrl}/api/sendText`;

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api_key": apiKey,
                "X-API-Key": apiKey,
            },
            body: JSON.stringify({
                to: `${cleanMobile}@c.us`,
                content: message,
            }),
        });

        const data = await res.json().catch(() => ({}));
        return { sent: res.ok, data };
    } catch (error) {
        console.error("[WhatsApp OTP Error]:", error);
        return { sent: false, error: String(error) };
    }
}
