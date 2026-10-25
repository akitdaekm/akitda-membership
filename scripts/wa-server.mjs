import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8085;
const API_KEY = process.env.WHATSAPP_API_KEY || "my_secret_key_123";

let sock = null;
let latestQR = null;
let isConnected = false;
let userJid = null;

async function startWhatsApp() {
    const authPath = path.join(__dirname, "../baileys_auth");
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["AKITDA Portal", "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            latestQR = qr;
            console.log("\n=======================================================");
            console.log("   SCAN THIS QR CODE IN WHATSAPP TO CONNECT:");
            console.log(`   (Or open in browser: http://localhost:${PORT})`);
            console.log("=======================================================\n");
            qrcodeTerminal.generate(qr, { small: true });
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            isConnected = false;
            userJid = null;
            console.log(`Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                setTimeout(startWhatsApp, 3000);
            } else {
                console.log("Logged out. Please delete 'baileys_auth' folder and restart to rescan.");
            }
        } else if (connection === "open") {
            isConnected = true;
            latestQR = null;
            userJid = sock.user?.id || "Connected";
            console.log("\n=======================================================");
            console.log(`   WHATSAPP CONNECTED SUCCESSFULLY! [${userJid}]`);
            console.log(`   HTTP API ready at: http://localhost:${PORT}`);
            console.log("=======================================================\n");
        }
    });
}

// HTTP API Server
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, api_key, X-API-Key");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Home / QR Display in Browser
    if (url.pathname === "/" || url.pathname === "/qr") {
        res.writeHead(200, { "Content-Type": "text/html" });
        if (isConnected) {
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>AKITDA WhatsApp Server</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #0b1120; color: #fff;">
                    <h1 style="color: #22c55e;">&#10004; WhatsApp Server is Connected!</h1>
                    <p style="color: #94a3b8; font-size: 18px;">Account: <strong>${userJid}</strong></p>
                    <p style="color: #64748b;">Ready to dispatch OTPs to any mobile number.</p>
                </body>
                </html>
            `);
            return;
        }

        if (latestQR) {
            const qrImage = await QRCode.toDataURL(latestQR, { width: 320 });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Scan WhatsApp QR Code</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta http-equiv="refresh" content="5">
                </head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #0b1120; color: #fff;">
                    <h2>Scan with WhatsApp on your phone</h2>
                    <p style="color: #94a3b8;">WhatsApp > Linked Devices > Link a Device</p>
                    <div style="background: #fff; padding: 15px; display: inline-block; border-radius: 12px; margin-top: 15px;">
                        <img src="${qrImage}" alt="WhatsApp QR Code" style="display: block;" />
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Page auto-refreshes every 5 seconds...</p>
                </body>
                </html>
            `);
            return;
        }

        res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>AKITDA WhatsApp</title><meta http-equiv="refresh" content="3"></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #0b1120; color: #fff;">
                <h2>Generating WhatsApp QR Code...</h2>
                <p style="color: #94a3b8;">Please wait a moment.</p>
            </body>
            </html>
        `);
        return;
    }

    // Health check
    if (url.pathname === "/health" || url.pathname === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", connected: isConnected, user: userJid }));
        return;
    }

    // Send Text Message endpoint (compatible with Open-WA & Baileys)
    if (url.pathname === "/api/sendText" || url.pathname === "/api/messages/sendText" || url.pathname === "/send") {
        if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
            return;
        }

        const providedKey = req.headers["x-api-key"] || req.headers["api_key"];
        if (API_KEY && providedKey !== API_KEY) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized. Invalid API key." }));
            return;
        }

        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
            try {
                const { to, content } = JSON.parse(body || "{}");
                if (!to || !content) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Missing 'to' or 'content' in body" }));
                    return;
                }

                if (!isConnected || !sock) {
                    res.writeHead(503, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "WhatsApp is not connected yet. Please scan the QR code." }));
                    return;
                }

                // Format JID: remove non-digits, ensure country code 91 if 10 digits
                let cleanNumber = to.replace(/[^0-9]/g, "");
                if (cleanNumber.length === 10) {
                    cleanNumber = `91${cleanNumber}`;
                }
                const jid = `${cleanNumber}@s.whatsapp.net`;

                console.log(`[WhatsApp Outgoing] Sending message to: ${jid}`);
                const sentMessage = await sock.sendMessage(jid, { text: content });

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, messageId: sentMessage.key.id, to: jid }));
            } catch (err) {
                console.error("[WhatsApp Send Error]:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message || "Failed to send message" }));
            }
        });
        return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, () => {
    console.log(`\n>>> AKITDA WhatsApp Server running on http://localhost:${PORT} <<<`);
    startWhatsApp();
});
