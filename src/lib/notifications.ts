import nodemailer from "nodemailer";
import { resolveWhatsAppGatewayUrl } from "@/lib/whatsapp-gateway";

type NotificationChannel = "SMS" | "WHATSAPP" | "EMAIL";

interface NotificationPayload {
    to: string;       // Phone number or Email
    message: string;  // Content
    subject?: string; // For Email
    html?: string;    // Optional HTML for Email
}

async function sendWhatsAppText(mobile: string, message: string): Promise<boolean> {
    try {
        let cleanMobile = mobile.replace(/[^0-9]/g, "");
        if (cleanMobile.length === 10) {
            cleanMobile = `91${cleanMobile}`;
        }

        const apiUrl = await resolveWhatsAppGatewayUrl();
        const apiKey = process.env.WHATSAPP_API_KEY || "my_secret_key_123";
        const endpoint = apiUrl.includes("/api/") ? apiUrl : `${apiUrl}/api/sendText`;

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
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            console.warn("[NotificationService WhatsApp] Failed:", res.status, await res.text().catch(() => ""));
            return false;
        }
        return true;
    } catch (error) {
        console.error("[NotificationService WhatsApp Error]:", error);
        return false;
    }
}

async function sendEmailMessage(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `"AKITDA" <${user}>`;

    if (!host || !user || !pass || !to) {
        console.warn("[NotificationService Email] SMTP credentials or recipient missing. Skipped.");
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });

        await transporter.sendMail({
            from,
            to,
            subject,
            text,
            html: html || `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;"><h2 style="color: #1e3a8a;">AKITDA Ernakulam</h2><p style="white-space: pre-line; color: #334155; line-height: 1.6;">${text}</p><hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" /><p style="color: #64748b; font-size: 12px;">All Kerala IT Dealers Association (AKITDA)</p></div>`,
        });
        return true;
    } catch (error) {
        console.error("[NotificationService Email Error]:", error);
        return false;
    }
}

export function formatMemberGreeting(
    primaryMemberName?: string | null,
    companyName?: string | null
): string {
    const primary = primaryMemberName?.trim() || "";
    const company = companyName?.trim() || "";
    if (primary && company) {
        return `${primary} (${company})`;
    }
    return primary || company || "Member";
}

export const NotificationService = {
    async send(channel: NotificationChannel, payload: NotificationPayload) {
        console.log(`[NotificationService] Sending ${channel} to ${payload.to}`);
        if (channel === "WHATSAPP") {
            return sendWhatsAppText(payload.to, payload.message);
        }
        if (channel === "EMAIL") {
            return sendEmailMessage(
                payload.to,
                payload.subject || "AKITDA Membership Update",
                payload.message,
                payload.html
            );
        }
        return true;
    },

    async sendWelcome(name: string, phone: string, email?: string) {
        const message = `Welcome to AKITDA, ${name}!\n\nYour membership application has been received and is currently pending Committee Approval (any 2 of President, Secretary, Treasurer).\n\nOnce approved, you will receive another notification and can log in at https://akitdaekm.com/login using OTP.`;
        await Promise.all([
            this.send("WHATSAPP", { to: phone, message }),
            email
                ? this.send("EMAIL", {
                      to: email,
                      subject: "Welcome to AKITDA - Application Received",
                      message,
                  })
                : Promise.resolve(false),
        ]);
    },

    async sendApprovalNotification(name: string, phone: string, email?: string) {
        const message = `Congratulations ${name}!\n\nYour AKITDA membership application has been APPROVED by the Committee.\n\nYou can now log in to the Member Portal at https://akitdaekm.com/login using OTP to complete your membership payment and download your documents.`;
        await Promise.all([
            this.send("WHATSAPP", { to: phone, message }),
            email
                ? this.send("EMAIL", {
                      to: email,
                      subject: "AKITDA Membership Approved - Login Ready",
                      message,
                  })
                : Promise.resolve(false),
        ]);
    },

    async sendActivationNotification(name: string, phone: string, email?: string, membershipId?: string) {
        const idText = membershipId ? ` (Membership ID: ${membershipId})` : "";
        const message = `Dear ${name},\n\nYour AKITDA Membership${idText} is now ACTIVE! You can log in at https://akitdaekm.com/login using OTP to download your Membership Certificate.`;
        await Promise.all([
            this.send("WHATSAPP", { to: phone, message }),
            email
                ? this.send("EMAIL", {
                      to: email,
                      subject: "AKITDA Membership Activated",
                      message,
                  })
                : Promise.resolve(false),
        ]);
    },

    async sendPaymentReceipt(name: string, phone: string, receiptNo: string) {
        const message = `Dear ${name}, Payment received for AKITDA Membership. Receipt No: ${receiptNo}. Your membership is now ACTIVE. Log in at https://akitdaekm.com/login to download your certificate and receipt.`;
        await this.send("WHATSAPP", { to: phone, message });
    },

    async sendInvoiceNotification(name: string, phone: string, email: string, invoiceNo: string) {
        const message = `Dear ${name}, Your Tax Invoice (No: ${invoiceNo}) for AKITDA Membership has been generated. Please download it from your dashboard at https://akitdaekm.com/login.`;
        await Promise.all([
            this.send("WHATSAPP", { to: phone, message }),
            this.send("EMAIL", { to: email, message, subject: "AKITDA Tax Invoice Generated" }),
        ]);
    },
};
