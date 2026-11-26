"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import QRCode from "qrcode";
import {
    AlertTriangle,
    Camera,
    CameraOff,
    CheckCircle2,
    Printer,
} from "lucide-react";

export interface AgmScanRecord {
    id: string;
    name: string;
    company: string;
    designation: string | null;
    district: string | null;
    phone: string | null;
    fullCode: string;
    scannedAt: string;
}

interface AgmScannerStationProps {
    onScanRecorded?: () => void;
    onUnauthorized?: () => void;
}

declare global {
    interface Window {
        Html5Qrcode?: any;
    }
}

export default function AgmScannerStation({
    onScanRecorded,
    onUnauthorized,
}: AgmScannerStationProps) {
    const [manualCode, setManualCode] = useState("");
    const [scanningBusy, setScanningBusy] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [autoPrint, setAutoPrint] = useState(true);
    const [lastScanResult, setLastScanResult] = useState<{
        isDuplicate: boolean;
        scan: AgmScanRecord;
        previousScan?: AgmScanRecord | null;
    } | null>(null);
    const [badgeQrUrl, setBadgeQrUrl] = useState<string>("");
    const [pendingAutoPrint, setPendingAutoPrint] = useState(false);

    const html5QrRef = useRef<any>(null);
    const scannerInputRef = useRef<HTMLInputElement>(null);

    const stopCamera = useCallback(async () => {
        if (html5QrRef.current) {
            try {
                await html5QrRef.current.stop();
                html5QrRef.current.clear();
            } catch {
                // ignore
            }
            html5QrRef.current = null;
        }
        setCameraActive(false);
    }, []);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // Trigger print preview automatically once the 50mm x 50mm QR image is in the DOM
    useEffect(() => {
        if (!pendingAutoPrint || !badgeQrUrl || !lastScanResult) return;
        const timer = setTimeout(() => {
            setPendingAutoPrint(false);
            window.print();
            scannerInputRef.current?.focus();
        }, 180);
        return () => clearTimeout(timer);
    }, [pendingAutoPrint, badgeQrUrl, lastScanResult]);

    const submitScan = useCallback(
        async (rawCode: string) => {
            const trimmed = rawCode.trim();
            if (!trimmed || scanningBusy) return;
            setScanningBusy(true);
            try {
                const res = await fetch("/api/agm/scans", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: trimmed }),
                });
                if (res.status === 401) {
                    onUnauthorized?.();
                    return;
                }
                const data = await res.json();
                if (res.ok && data.status === "success") {
                    const qr = await QRCode.toDataURL(data.scan.fullCode, {
                        width: 220,
                        margin: 1,
                    });
                    setLastScanResult({
                        isDuplicate: Boolean(data.isDuplicate),
                        scan: data.scan,
                        previousScan: data.previousScan,
                    });
                    setBadgeQrUrl(qr);
                    setManualCode("");
                    if (autoPrint) {
                        setPendingAutoPrint(true);
                    }
                    onScanRecorded?.();
                }
            } finally {
                setScanningBusy(false);
                scannerInputRef.current?.focus();
            }
        },
        [autoPrint, onScanRecorded, onUnauthorized, scanningBusy]
    );

    const startCamera = async () => {
        setCameraError(null);
        if (!window.Html5Qrcode) {
            setCameraError("QR scanner library is still loading. Please try again in a second.");
            return;
        }
        try {
            const qr = new window.Html5Qrcode("agm-camera-reader");
            html5QrRef.current = qr;
            await qr.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                (decodedText: string) => {
                    submitScan(decodedText);
                },
                () => {}
            );
            setCameraActive(true);
        } catch (err: any) {
            setCameraError(err?.message || "Could not start camera. Check browser permissions.");
            setCameraActive(false);
        }
    };

    return (
        <>
            <Script src="/vendor/html5-qrcode.min.js" strategy="afterInteractive" />

            <style jsx global>{`
                @page {
                    size: 50mm 50mm;
                    margin: 0;
                }
                @media print {
                    html,
                    body {
                        width: 50mm !important;
                        height: 50mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #thermal-badge-print,
                    #thermal-badge-print * {
                        visibility: visible !important;
                    }
                    #thermal-badge-print {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 50mm !important;
                        height: 50mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        padding: 2mm !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                    }
                }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-white">Scan Delegate Pass</h2>
                        <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={autoPrint}
                                onChange={(e) => setAutoPrint(e.target.checked)}
                                className="rounded border-slate-600 accent-orange-500"
                            />
                            Auto-Print 50×50mm Sticker
                        </label>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            submitScan(manualCode);
                        }}
                        className="flex gap-2"
                    >
                        <input
                            ref={scannerInputRef}
                            type="text"
                            autoFocus
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Scan with USB scanner or enter Pass ID (e.g. AK-1A2B3C)..."
                            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                            type="submit"
                            disabled={scanningBusy}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                        >
                            {scanningBusy ? "Scanning..." : "Check In"}
                        </button>
                    </form>

                    <div className="border-t border-slate-800 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Camera QR Scanner
                            </span>
                            {!cameraActive ? (
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    Start Camera
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                                >
                                    <CameraOff className="h-3.5 w-3.5" />
                                    Stop Camera
                                </button>
                            )}
                        </div>
                        {cameraError && (
                            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                                {cameraError}
                            </div>
                        )}
                        <div
                            id="agm-camera-reader"
                            className="w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[220px]"
                        />
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Last Check-In &amp; 50×50mm Sticker</h2>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            50mm × 50mm
                        </span>
                    </div>

                    {lastScanResult ? (
                        <div className="space-y-4">
                            <div
                                className={`p-4 rounded-xl border ${
                                    lastScanResult.isDuplicate
                                        ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                                        : "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-base">
                                    {lastScanResult.isDuplicate ? (
                                        <>
                                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                                            Duplicate Scan Detected
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                            Check-In Recorded
                                        </>
                                    )}
                                </div>
                                {lastScanResult.isDuplicate && lastScanResult.previousScan && (
                                    <p className="text-xs mt-1">
                                        Previously scanned at{" "}
                                        {new Date(lastScanResult.previousScan.scannedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            {/* On-screen preview of 50mm x 50mm sticker */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                <div
                                    className="bg-white text-black rounded-lg p-2.5 flex flex-col items-center justify-center text-center shrink-0 shadow"
                                    style={{ width: "188px", height: "188px" }}
                                >
                                    {badgeQrUrl && (
                                        <img src={badgeQrUrl} alt="Sticker QR" className="w-24 h-24 object-contain" />
                                    )}
                                    <div className="font-bold text-xs leading-tight mt-1 line-clamp-1">
                                        {lastScanResult.scan.name}
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-700 leading-tight line-clamp-1">
                                        {lastScanResult.scan.company}
                                    </div>
                                    <div className="text-[9px] text-slate-600 leading-tight mt-0.5 line-clamp-1">
                                        {lastScanResult.scan.designation || "Member"} • {lastScanResult.scan.district || "Ernakulam"}
                                    </div>
                                    <div className="text-[8px] text-slate-500 mt-0.5">
                                        AKITDA GB 2026 • 15 Dec
                                    </div>
                                </div>

                                <div className="space-y-1 text-center sm:text-left">
                                    <div className="text-lg font-bold text-white">
                                        {lastScanResult.scan.name}
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        {lastScanResult.scan.company}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {lastScanResult.scan.designation} • {lastScanResult.scan.district} •{" "}
                                        {lastScanResult.scan.phone}
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold cursor-pointer"
                                        >
                                            <Printer className="h-4 w-4" />
                                            Print 50×50mm Sticker
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden 50mm x 50mm print target */}
                            <div id="thermal-badge-print" className="hidden">
                                {badgeQrUrl && (
                                    <img
                                        src={badgeQrUrl}
                                        alt="Badge QR"
                                        style={{ width: "28mm", height: "28mm", objectFit: "contain" }}
                                    />
                                )}
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: "9.5pt",
                                        lineHeight: 1.15,
                                        marginTop: "1mm",
                                        textAlign: "center",
                                        maxWidth: "46mm",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {lastScanResult.scan.name}
                                </div>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        fontSize: "8pt",
                                        lineHeight: 1.15,
                                        textAlign: "center",
                                        maxWidth: "46mm",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {lastScanResult.scan.company}
                                </div>
                                <div
                                    style={{
                                        fontSize: "7pt",
                                        lineHeight: 1.15,
                                        marginTop: "0.4mm",
                                        textAlign: "center",
                                        maxWidth: "46mm",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {lastScanResult.scan.designation || "Member"} • {lastScanResult.scan.district || "Ernakulam"}
                                </div>
                                <div style={{ fontSize: "6pt", marginTop: "0.5mm", textAlign: "center" }}>
                                    AKITDA GB 2026 • 15 Dec
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Scan a delegate QR code or enter a Pass ID. Print preview will open automatically for your 50×50mm sticker printer.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
