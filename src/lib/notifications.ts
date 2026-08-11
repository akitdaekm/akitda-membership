
// Basic Interface for Notification Service
// In the future, we can swap this with Twilio, Msg91, Interakt, etc.

type NotificationChannel = "SMS" | "WHATSAPP" | "EMAIL";

interface NotificationPayload {
    to: string;       // Phone number or Email
    message: string;  // Content
    subject?: string; // For Email
}

export const NotificationService = {
    async send(channel: NotificationChannel, payload: NotificationPayload) {
        console.log(`[NotificationService] Sending ${channel} to ${payload.to}:`, payload.message);

        // TODO: Integrate actual providers here
        // Example:
        // if (channel === "SMS") await sendTwilioSMS(payload.to, payload.message);
        // if (channel === "WHATSAPP") await sendInteraktWhatsApp(payload.to, payload.message);

        return true;
    },

    async sendWelcome(name: string, phone: string) {
        const message = `Welcome to AKITDA, ${name}! Your application has been received.`;
        await this.send("SMS", { to: phone, message });
        await this.send("WHATSAPP", { to: phone, message });
    },

    async sendPaymentReceipt(name: string, phone: string, receiptNo: string) {
        const message = `Dear ${name}, Payment received for AKITDA Membership. Receipt No: ${receiptNo}. Your membership is now ACTIVE.`;
        await this.send("SMS", { to: phone, message });
        await this.send("WHATSAPP", { to: phone, message });
    },

    async sendInvoiceNotification(name: string, phone: string, email: string, invoiceNo: string) {
        const message = `Dear ${name}, Your Tax Invoice (No: ${invoiceNo}) for AKITDA Membership has been generated. Please download it from your dashboard.`;
        await this.send("SMS", { to: phone, message });
        await this.send("WHATSAPP", { to: phone, message });
        await this.send("EMAIL", { to: email, message, subject: "AKITDA Tax Invoice Generated" });
    }
};
