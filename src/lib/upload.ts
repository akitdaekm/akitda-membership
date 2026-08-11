import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import fs from "fs";

/**
 * Save an uploaded file securely.
 * On local dev, saves to public/uploads directory.
 * On Vercel (read-only serverless filesystem), converts to Data URL (base64) so it works 100% reliably.
 */
export async function saveUploadedFile(
    file: File,
    folderName: string = "uploads",
    prefix: string = "file"
): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "application/octet-stream";

    // Check if running on Vercel
    const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);

    if (isVercel) {
        const base64 = buffer.toString("base64");
        return `data:${mimeType};base64,${base64}`;
    }

    try {
        const uploadDir = join(process.cwd(), "public", folderName);
        if (!fs.existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const safeFilename = file.name ? file.name.replace(/[^a-zA-Z0-9_.-]/g, "_") : "document";
        const filename = `${prefix}-${Date.now()}-${safeFilename}`;
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        return `/${folderName}/${filename}`;
    } catch (error) {
        console.warn("[Upload Warning] File write failed, falling back to Data URL:", error);
        const base64 = buffer.toString("base64");
        return `data:${mimeType};base64,${base64}`;
    }
}
