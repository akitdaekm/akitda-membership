import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function openBase64File(dataUrl: string) {
  if (!dataUrl) return;

  if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    window.open(dataUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (dataUrl.startsWith("data:")) {
    try {
      const parts = dataUrl.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const newTab = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (!newTab) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = mime.includes("pdf") ? "document.pdf" : "document";
        a.click();
      }
    } catch (e) {
      console.error("Failed to parse base64 file:", e);
      window.open(dataUrl, "_blank");
    }
  } else {
    window.open(dataUrl, "_blank");
  }
}
