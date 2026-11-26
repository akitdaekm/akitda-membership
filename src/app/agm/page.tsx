"use client";

import React, { useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
    Calendar,
    CheckCircle2,
    Download,
    Printer,
    RotateCcw,
    Shield,
    Sparkles,
    UserCheck,
} from "lucide-react";

interface RegistrationResult {
    id: string;
    passId: string;
    name: string;
    company: string;
    designation: string;
    district: string;
    phone: string;
    email: string | null;
    qrPayload: string;
    registeredAt: string;
}

const KERALA_DISTRICTS = [
    "Ernakulam",
    "Thiruvananthapuram",
    "Kollam",
    "Pathanamthitta",
    "Alappuzha",
    "Kottayam",
    "Idukki",
    "Thrissur",
    "Palakkad",
    "Malappuram",
    "Kozhikode",
    "Wayanad",
    "Kannur",
    "Kasaragod",
];

const DESIGNATIONS = [
    "Member",
    "State Executive Member",
    "Distributor",
    "Vendor",
    "Exhibitor",
    "Guest",
];

export default function AgmRegistrationPage() {
    const [fullName, setFullName] = useState("");
    const [company, setCompany] = useState("");
    const [designation, setDesignation] = useState("Member");
    const [district, setDistrict] = useState("Ernakulam");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [registration, setRegistration] = useState<RegistrationResult | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSubmitting(true);

        try {
            const res = await fetch("/api/agm/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: fullName,
                    company,
                    designation,
                    district,
                    phone,
                    email,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.status !== "success") {
                setErrorMsg(data.message || "Registration failed. Please check your details.");
                return;
            }

            const reg: RegistrationResult = data.registration;
            const qrUrl = await QRCode.toDataURL(reg.qrPayload, {
                width: 320,
                margin: 2,
                color: { dark: "#0f172a", light: "#ffffff" },
            });
            setQrDataUrl(qrUrl);
            setRegistration(reg);
        } catch {
            setErrorMsg("Network error while submitting registration. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadPass = () => {
        if (!qrDataUrl || !registration) return;
        const canvas = document.createElement("canvas");
        canvas.width = 720;
        canvas.height = 920;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header banner
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, 160);
        ctx.fillStyle = "#f97316";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("AKITDA GENERAL BODY 2026", 40, 68);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "20px sans-serif";
        ctx.fillText("15th December 2026  •  Official Entry Pass", 40, 108);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 22px monospace";
        ctx.fillText(registration.passId, 40, 142);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 150, 188, 420, 420);

            ctx.textAlign = "center";
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 38px sans-serif";
            ctx.fillText(registration.name, canvas.width / 2, 668);

            ctx.fillStyle = "#334155";
            ctx.font = "600 28px sans-serif";
            ctx.fillText(registration.company, canvas.width / 2, 718);

            ctx.fillStyle = "#475569";
            ctx.font = "600 24px sans-serif";
            ctx.fillText(`${registration.designation}  •  ${registration.district}`, canvas.width / 2, 774);

            ctx.fillStyle = "#94a3b8";
            ctx.font = "16px sans-serif";
            ctx.fillText("Present this QR pass at the venue registration desk.", canvas.width / 2, 872);
            ctx.textAlign = "left";

            const link = document.createElement("a");
            link.download = `AKITDA_AGM_Pass_${registration.passId}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        img.src = qrDataUrl;
    };

    const handleReset = () => {
        setRegistration(null);
        setQrDataUrl("");
        setFullName("");
        setCompany("");
        setDesignation("Member");
        setDistrict("Ernakulam");
        setPhone("");
        setEmail("");
        setErrorMsg(null);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #agm-pass-card,
                    #agm-pass-card * {
                        visibility: visible !important;
                    }
                    #agm-pass-card {
                        position: fixed;
                        left: 50%;
                        top: 24px;
                        transform: translateX(-50%);
                        width: 360px;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-2xl">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-4 px-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                        <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                        AKITDA Ernakulam Portal
                    </span>
                    <Link
                        href="/agm/admin"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-orange-400 transition-colors"
                    >
                        <Shield className="h-3.5 w-3.5" />
                        Committee / Staff Station
                    </Link>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur">
                    {!registration ? (
                        <div>
                            {/* Header */}
                            <div className="text-center mb-6">
                                <img
                                    src="/akitda-logo.png"
                                    alt="AKITDA Logo"
                                    className="mx-auto mb-3 h-16 w-auto object-contain"
                                />
                                <div className="inline-flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-300 font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Event Date: 15th December 2026
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                                    <span className="text-orange-400">All Kerala IT Dealers Association</span>
                                    <span className="block text-sm sm:text-base font-semibold text-orange-200 mt-0.5">
                                        Ernakulam District Committee
                                    </span>
                                    <span className="block text-xl sm:text-2xl text-slate-100 mt-1">
                                        General Body Meeting 2026
                                    </span>
                                </h1>
                                <p className="text-slate-400 mt-1.5 text-sm">
                                    Official Delegate Registration • 15th December 2026
                                </p>
                            </div>

                            {/* Registration Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="fullName"
                                        className="block text-xs font-semibold text-slate-300 mb-1.5"
                                    >
                                        Full Name *
                                    </label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Delegate Full Name"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="company"
                                        className="block text-xs font-semibold text-slate-300 mb-1.5"
                                    >
                                        Company / Firm Name *
                                    </label>
                                    <input
                                        id="company"
                                        type="text"
                                        required
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="Business / Firm Name"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="designation"
                                            className="block text-xs font-semibold text-slate-300 mb-1.5"
                                        >
                                            Designation *
                                        </label>
                                        <select
                                            id="designation"
                                            value={designation}
                                            onChange={(e) => setDesignation(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {DESIGNATIONS.map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="district"
                                            className="block text-xs font-semibold text-slate-300 mb-1.5"
                                        >
                                            District *
                                        </label>
                                        <select
                                            id="district"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {KERALA_DISTRICTS.map((dist) => (
                                                <option key={dist} value={dist}>
                                                    {dist}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className="block text-xs font-semibold text-slate-300 mb-1.5"
                                        >
                                            Phone Number *
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="10-digit mobile number"
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-xs font-semibold text-slate-300 mb-1.5"
                                        >
                                            Email (Optional)
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@address.com"
                                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <UserCheck className="h-4 w-4" />
                                    {submitting ? "Generating Entry Pass..." : "Generate Official Entry Pass"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300">
                                <div className="flex items-center justify-center gap-2 text-xl font-bold">
                                    <CheckCircle2 className="h-6 w-6" />
                                    Registration Successful!
                                </div>
                                <p className="text-xs text-emerald-200/80 mt-1">
                                    Your official General Body Meeting entry pass has been generated.
                                </p>
                            </div>

                            <div
                                id="agm-pass-card"
                                className="bg-white text-slate-900 rounded-2xl p-6 max-w-sm mx-auto shadow-xl text-left border border-slate-200"
                            >
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                                    <div className="flex items-center gap-2.5">
                                        <img src="/akitda-logo.png" alt="AKITDA" className="h-9 w-auto" />
                                        <div>
                                            <div className="text-xs font-extrabold text-slate-900">AKITDA</div>
                                            <div className="text-[11px] text-slate-500">
                                                General Body • 15 Dec 2026
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-800 border border-slate-200">
                                        {registration.passId}
                                    </span>
                                </div>

                                <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-center mb-4">
                                    {qrDataUrl && (
                                        <img
                                            src={qrDataUrl}
                                            alt={`QR Pass ${registration.passId}`}
                                            className="w-56 h-56 object-contain"
                                        />
                                    )}
                                </div>

                                <div className="space-y-1.5 text-center">
                                    <div className="text-xl font-bold text-slate-900 leading-snug">
                                        {registration.name}
                                    </div>
                                    <div className="text-base font-semibold text-slate-700">
                                        {registration.company}
                                    </div>
                                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-700">
                                        <span className="bg-slate-100 px-3 py-1 rounded-md font-medium">
                                            {registration.designation}
                                        </span>
                                        <span className="bg-slate-100 px-3 py-1 rounded-md font-medium">
                                            {registration.district}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleDownloadPass}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Pass (PNG)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print Pass
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Register Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
