import { createRequire } from "module";
import { inflateSync, inflateRawSync } from "zlib";

/**
 * Extracts literal and hex strings from PDF text-showing operators (Tj, TJ, ', ").
 */
function extractTextFromPdfContentStream(content: string): string {
    const chunks: string[] = [];

    // Match BT ... ET text blocks when present; otherwise scan the full stream
    const blocks = content.match(/BT[\s\S]*?ET/g) ?? [content];

    for (const block of blocks) {
        // 1. Literal strings: ( ... ) with escaped parens/chars
        const literalRegex = /\((?:\\.|[^\\()])*\)/g;
        let match: RegExpExecArray | null;
        while ((match = literalRegex.exec(block)) !== null) {
            const raw = match[0].slice(1, -1);
            const decoded = raw
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "\r")
                .replace(/\\t/g, "\t")
                .replace(/\\([()\\])/g, "$1")
                .replace(/\\([0-7]{1,3})/g, (_, oct) =>
                    String.fromCharCode(parseInt(oct, 8))
                );
            if (decoded.trim()) {
                chunks.push(decoded);
            }
        }

        // 2. Hex strings: <...> (often UTF-16BE or 1-byte ASCII/CID)
        const hexRegex = /<([0-9A-Fa-f\s]{2,})>/g;
        while ((match = hexRegex.exec(block)) !== null) {
            const hex = match[1].replace(/\s+/g, "");
            if (hex.length % 2 !== 0) continue;

            const bytes = Buffer.from(hex, "hex");
            let str = "";

            // Check for UTF-16BE BOM or null-interleaved ASCII (e.g. 00 41 00 42)
            if (
                (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) ||
                (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] >= 0x20 && bytes[1] <= 0x7e)
            ) {
                const start = bytes[0] === 0xfe && bytes[1] === 0xff ? 2 : 0;
                for (let i = start; i + 1 < bytes.length; i += 2) {
                    const code = (bytes[i] << 8) | bytes[i + 1];
                    if (code >= 0x20 && code !== 0x7f) {
                        str += String.fromCharCode(code);
                    }
                }
            } else {
                for (let i = 0; i < bytes.length; i++) {
                    const b = bytes[i];
                    if (b >= 0x20 && b <= 0x7e) {
                        str += String.fromCharCode(b);
                    }
                }
            }

            if (str.trim()) {
                chunks.push(str);
            }
        }
    }

    return chunks.join(" ");
}

/**
 * Pure-Node fallback PDF text extractor using zlib for FlateDecode streams.
 */
function extractPdfTextFallback(buffer: Buffer): string {
    const latin = buffer.toString("latin1");
    const extractedParts: string[] = [];

    let searchFrom = 0;
    while (true) {
        const streamIdx = latin.indexOf("stream", searchFrom);
        if (streamIdx === -1) break;

        let dataStart = streamIdx + 6;
        if (latin[dataStart] === "\r" && latin[dataStart + 1] === "\n") {
            dataStart += 2;
        } else if (latin[dataStart] === "\n" || latin[dataStart] === "\r") {
            dataStart += 1;
        } else {
            searchFrom = streamIdx + 6;
            continue;
        }

        const endIdx = latin.indexOf("endstream", dataStart);
        if (endIdx === -1) break;

        let dataEnd = endIdx;
        if (latin[dataEnd - 1] === "\n") dataEnd--;
        if (latin[dataEnd - 1] === "\r") dataEnd--;

        const rawStream = buffer.subarray(dataStart, dataEnd);
        searchFrom = endIdx + 9;

        if (rawStream.length === 0) continue;

        let decodedStream: string | null = null;
        try {
            decodedStream = inflateSync(rawStream).toString("latin1");
        } catch {
            try {
                decodedStream = inflateRawSync(rawStream).toString("latin1");
            } catch {
                // Not zlib-compressed; check if it's plain-text PDF operators
                const plain = rawStream.toString("latin1");
                if (plain.includes("BT") || plain.includes("Tj") || plain.includes("TJ")) {
                    decodedStream = plain;
                }
            }
        }

        if (decodedStream) {
            const text = extractTextFromPdfContentStream(decodedStream);
            if (text) {
                extractedParts.push(text);
            }
        }
    }

    return extractedParts.join("\n");
}

/**
 * Extracts readable text from a PDF buffer.
 * Uses pdf-parse first, with a pure-Node zlib fallback if pdf-parse fails
 * (e.g. due to newer PDF features or standalone bundling issues).
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
    const header = buffer.subarray(0, 1024).toString("latin1");
    if (!header.includes("%PDF-")) {
        throw new Error("Invalid PDF header: file does not start with %PDF-");
    }

    let pdfParseError: unknown = null;
    try {
        const require = createRequire(import.meta.url);
        const pdfParse = require("pdf-parse/lib/pdf-parse.js");
        const parsed = await pdfParse(buffer);
        if (parsed?.text && parsed.text.trim().length > 0) {
            return parsed.text;
        }
    } catch (err) {
        pdfParseError = err;
        console.warn("pdf-parse failed, attempting zlib fallback:", err);
    }

    const fallbackText = extractPdfTextFallback(buffer);
    if (fallbackText.trim().length > 0) {
        return fallbackText;
    }

    if (pdfParseError) {
        // Still allow caller to distinguish between unreadable/corrupt vs scanned PDF
        // only if fallback also found nothing. Log the original error for diagnostics.
        console.error("Both pdf-parse and fallback PDF extraction failed:", pdfParseError);
        throw pdfParseError;
    }

    return "";
}
