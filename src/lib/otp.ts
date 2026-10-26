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
 * Send OTP via WhatsApp (Fast2SMS / MSG91 / UltraMsg / Baileys Cloudflare Tunnel)
 */
export async function sendOtpWhatsApp(mobile: string, otp: string, companyName?: string) {
    const provider = (process.env.WHATSAPP_PROVIDER || "FAST2SMS").toUpperCase();
    const apiKey = process.env.WHATSAPP_API_KEY || process.env.SMS_API_KEY || "";

    // Standardize mobile number
    let cleanMobile = mobile.replace(/[^0-9]/g, "");
    if (cleanMobile.length === 10) {
        cleanMobile = `91${cleanMobile}`;
    }
    const tenDigitMobile = cleanMobile.length === 12 && cleanMobile.startsWith("91") ? cleanMobile.slice(2) : cleanMobile;

    const message = `*AKITDA Verification Code*\n\nHello ${companyName || "Member"},\nYour One-Time Password (OTP) for login verification is:\n\n*${otp}*\n\nThis OTP is valid for 10 minutes. Do not share this code with anyone.\n\n_All Kerala IT Dealers Association (AKITDA)_`;

    try {
        // 1. FAST2SMS WHATSAPP API
        if (provider === "FAST2SMS" && apiKey && apiKey !== "my_secret_key_123") {
            console.log(`[WhatsApp OTP] Dispatching via Fast2SMS to ${cleanMobile}...`);
            const encodedMsg = encodeURIComponent(message);
            const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=whatsapp&message=${encodedMsg}&numbers=${tenDigitMobile}`;
            
            const res = await fetch(fast2smsUrl, {
                method: "GET",
                signal: AbortSignal.timeout(10000),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.return) {
                return { sent: true, provider: "FAST2SMS", data };
            }
            console.warn("[Fast2SMS WhatsApp Warning] Fast2SMS returned error, checking fallback:", data);
        }

        // 2. MSG91 WHATSAPP OTP API
        if (provider === "MSG91" && apiKey && apiKey !== "my_secret_key_123") {
            console.log(`[WhatsApp OTP] Dispatching via MSG91 to ${cleanMobile}...`);
            const templateId = process.env.MSG91_WA_TEMPLATE_ID || process.env.MSG91_TEMPLATE_ID;
            
            let msg91Url = "";
            let options: RequestInit = { method: "POST", signal: AbortSignal.timeout(10000) };

            if (process.env.MSG91_INTEGRATED_NUMBER) {
                // MSG91 WhatsApp Outbound Message
                msg91Url = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";
                options.headers = {
                    "Content-Type": "application/json",
                    "authkey": apiKey,
                };
                options.body = JSON.stringify({
                    integrated_number: process.env.MSG91_INTEGRATED_NUMBER,
                    content_type: "template",
                    payload: {
                        to: cleanMobile,
                        type: "template",
                        template: {
                            name: templateId || "otp_verification",
                            language: { code: "en", policy: "deterministic" },
                            components: [
                                { type: "body", parameters: [{ type: "text", text: otp }] },
                                { type: "button", sub_type: "url", index: 0, parameters: [{ type: "text", text: otp }] }
                            ]
                        }
                    }
                });
            } else {
                // MSG91 Integrated OTP endpoint
                msg91Url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanMobile}&authkey=${apiKey}&otp=${otp}`;
                options.headers = { "Content-Type": "application/json" };
                options.body = JSON.stringify({ otp });
            }

            const res = await fetch(msg91Url, options);
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                return { sent: true, provider: "MSG91", data };
            }
            console.warn("[MSG91 WhatsApp Warning] MSG91 returned error, checking fallback:", data);
        }

        // 3. ULTRAMSG CLOUD API
        if (provider === "ULTRAMSG" && apiKey && apiKey !== "my_secret_key_123") {
            const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
            const ultramsgUrl = `https://api.ultramsg.com/${instanceId}/messages/chat`;
            const res = await fetch(ultramsgUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: apiKey,
                    to: cleanMobile,
                    body: message,
                }),
                signal: AbortSignal.timeout(10000),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                return { sent: true, provider: "ULTRAMSG", data };
            }
            console.warn("[UltraMsg Warning] UltraMsg returned error, checking fallback:", data);
        }

        // 4. BAILEYS / DATABASE-SYNCED CLOUDFLARE TUNNEL (AUTO-FALLBACK)
        let apiUrl = process.env.WHATSAPP_API_URL;
        if (!apiUrl || apiUrl.includes("localhost") || apiUrl.includes("trycloudflare.com")) {
            try {
                const dbSetting = await prisma.setting.findUnique({
                    where: { key: "WHATSAPP_API_URL" },
                });
                if (dbSetting?.value && dbSetting.value.startsWith("http")) {
                    apiUrl = dbSetting.value;
                }
            } catch (dbErr) {
                console.warn("[WhatsApp OTP] Could not fetch WHATSAPP_API_URL from Setting table:", dbErr);
            }
        }

        if (!apiUrl) {
            apiUrl = "https://britannica-safer-brunswick-health.trycloudflare.com";
        }
        const tunnelApiKey = process.env.WHATSAPP_API_KEY || "my_secret_key_123";

        const trimmedUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
        const endpoint = trimmedUrl.includes("/api/") ? trimmedUrl : `${trimmedUrl}/api/sendText`;

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api_key": tunnelApiKey,
                "X-API-Key": tunnelApiKey,
            },
            body: JSON.stringify({
                to: `${cleanMobile}@c.us`,
                content: message,
            }),
            signal: AbortSignal.timeout(10000),
        });

        const data = await res.json().catch(() => ({}));
        return { sent: res.ok, provider: "BAILEYS_GATEWAY", data };
    } catch (error) {
        console.error("[WhatsApp OTP Error]:", error);
        return { sent: false, error: String(error) };
    }
}
