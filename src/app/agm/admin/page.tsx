"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Download,
    KeyRound,
    Lock,
    QrCode,
    Search,
    Ticket,
    Trash2,
    UserPlus,
    Users,
} from "lucide-react";
import AgmScannerStation from "@/components/AgmScannerStation";

interface AgmRegistrationRow {
    id: string;
    passId: string;
    name: string;
    company: string;
    designation: string;
    district: string;
    phone: string;
    email: string | null;
    registeredAt: string;
    scanCount: number;
    lastScannedAt: string | null;
}

interface AgmScanRow {
    id: string;
    name: string;
    company: string;
    designation: string | null;
    district: string | null;
    phone: string | null;
    fullCode: string;
    scannedAt: string;
}

interface ScannerUserRow {
    username: string;
    label: string;
    createdAt: string;
}

type TabKey = "scanner" | "passes" | "attendance" | "scannerUsers";

export default function AgmAdminPage() {
    const [authState, setAuthState] = useState<"loading" | "authed" | "unauthed">("loading");
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>("scanner");

    const [registrations, setRegistrations] = useState<AgmRegistrationRow[]>([]);
    const [scans, setScans] = useState<AgmScanRow[]>([]);
    const [scannerUsers, setScannerUsers] = useState<ScannerUserRow[]>([]);
    const [passSearch, setPassSearch] = useState("");

    // Scanner user form
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newLabel, setNewLabel] = useState("Desk Scanner");
    const [userMsg, setUserMsg] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [regRes, scanRes, suRes] = await Promise.all([
                fetch("/api/agm/registrations"),
                fetch("/api/agm/scans"),
                fetch("/api/agm/scanner-users"),
            ]);
            if (regRes.status === 401 || scanRes.status === 401) {
                setAuthState("unauthed");
                return;
            }
            const regData = await regRes.json();
            const scanData = await scanRes.json();
            setRegistrations(regData.registrations || []);
            setScans(scanData.scans || []);
            if (suRes.ok) {
                const suData = await suRes.json();
                setScannerUsers(suData.users || []);
            }
            setAuthState("authed");
        } catch {
            setAuthState("unauthed");
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInlineLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        setLoggingIn(true);
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginError(data.message || "Invalid email or password");
                return;
            }
            setLoginPassword("");
            await loadData();
        } catch {
            setLoginError("Network error while signing in.");
        } finally {
            setLoggingIn(false);
        }
    };

    const handleDeleteScan = async (scanId: string) => {
        const res = await fetch(`/api/agm/scans/${scanId}`, { method: "DELETE" });
        if (res.ok) {
            await loadData();
        }
    };

    const handleDeleteRegistration = async (regId: string, passId: string) => {
        if (!window.confirm(`Delete registration ${passId}? The member will be able to register again.`)) {
            return;
        }
        const res = await fetch(`/api/agm/registrations/${regId}`, { method: "DELETE" });
        if (res.ok) {
            await loadData();
        }
    };

    const handleSaveScannerUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserMsg(null);
        const res = await fetch("/api/agm/scanner-users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: newUsername,
                password: newPassword,
                label: newLabel,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setUserMsg(data.message || "Failed to save scanner user");
            return;
        }
        setNewUsername("");
        setNewPassword("");
        setUserMsg(`Scanner user "${data.username}" saved.`);
        await loadData();
    };

    const handleDeleteScannerUser = async (username: string) => {
        setUserMsg(null);
        const res = await fetch(`/api/agm/scanner-users?username=${encodeURIComponent(username)}`, {
            method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
            setUserMsg(data.message || "Could not remove user");
            return;
        }
        await loadData();
    };

    const filteredPasses = registrations.filter((r) => {
        const q = passSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            r.name.toLowerCase().includes(q) ||
            r.company.toLowerCase().includes(q) ||
            r.passId.toLowerCase().includes(q) ||
            r.phone.toLowerCase().includes(q) ||
            r.district.toLowerCase().includes(q)
        );
    });

    const uniqueCheckedIn = registrations.filter((r) => r.scanCount > 0).length;

    if (authState === "loading") {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
                Loading AGM Admin Station...
            </div>
        );
    }

    if (authState === "unauthed") {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5 shadow-2xl">
                    <div className="text-center space-y-2">
                        <div className="mx-auto h-12 w-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Committee / Admin Sign In</h1>
                        <p className="text-xs text-slate-400">
                            Sign in with your AKITDA Admin account to access Scanner, Passes, and Attendance Viewer.
                        </p>
                    </div>
                    <form onSubmit={handleInlineLogin} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="admin@akitdaekm.com"
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        {loginError && (
                            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                                {loginError}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loggingIn}
                            className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
                        >
                            {loggingIn ? "Signing In..." : "Sign In & Open Admin Station"}
                        </button>
                    </form>
                    <div className="flex items-center justify-between pt-1 text-xs">
                        <Link href="/agm" className="text-slate-400 hover:text-slate-200">
                            ← Registration Form
                        </Link>
                        <Link href="/agm/scanner" className="text-orange-400 hover:text-orange-300 font-semibold">
                            Scanner-Only Login →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                            General Body Meeting • 15th December 2026
                        </div>
                        <h1 className="text-2xl font-bold text-white mt-0.5">AGM Admin &amp; Check-In Station</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href="/agm"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Registration Form
                        </Link>
                        <Link
                            href="/agm/scanner"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-xs font-semibold text-orange-300"
                        >
                            <QrCode className="h-3.5 w-3.5" />
                            Scanner-Only Portal
                        </Link>
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                        >
                            Main Admin Dashboard
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400">Total Passes Registered</div>
                        <div className="text-2xl font-bold text-white mt-1">{registrations.length}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400">Unique Delegates Checked In</div>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">{uniqueCheckedIn}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-400">Total Scans Recorded</div>
                        <div className="text-2xl font-bold text-blue-400 mt-1">{scans.length}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("scanner")}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
                            activeTab === "scanner"
                                ? "bg-orange-500 text-slate-950"
                                : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                        }`}
                    >
                        <QrCode className="h-4 w-4" />
                        QR Scanner
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("passes")}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
                            activeTab === "passes"
                                ? "bg-orange-500 text-slate-950"
                                : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                        }`}
                    >
                        <Ticket className="h-4 w-4" />
                        Passes Issued ({registrations.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("attendance")}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
                            activeTab === "attendance"
                                ? "bg-orange-500 text-slate-950"
                                : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        Attendance Viewer ({scans.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("scannerUsers")}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
                            activeTab === "scannerUsers"
                                ? "bg-orange-500 text-slate-950"
                                : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                        }`}
                    >
                        <KeyRound className="h-4 w-4" />
                        Scanner Users ({scannerUsers.length})
                    </button>
                </div>

                {/* Tab 1: Scanner */}
                {activeTab === "scanner" && (
                    <AgmScannerStation
                        onScanRecorded={loadData}
                        onUnauthorized={() => setAuthState("unauthed")}
                    />
                )}

                {/* Tab 2: Passes Issued */}
                {activeTab === "passes" && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="relative flex-1 min-w-[240px] max-w-md">
                                <Search className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    value={passSearch}
                                    onChange={(e) => setPassSearch(e.target.value)}
                                    placeholder="Search passes by name, company, pass ID, phone..."
                                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <a
                                href="/api/agm/export?type=registrations"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                                <Download className="h-4 w-4" />
                                Export Passes CSV
                            </a>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                                        <th className="py-3 px-3">Pass ID</th>
                                        <th className="py-3 px-3">Delegate</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">District</th>
                                        <th className="py-3 px-3">Phone</th>
                                        <th className="py-3 px-3">Status</th>
                                        <th className="py-3 px-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/70">
                                    {filteredPasses.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-800/40">
                                            <td className="py-2.5 px-3 font-mono text-xs text-blue-300">
                                                {r.passId}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-white">
                                                {r.name}
                                                <div className="text-[11px] text-slate-400">{r.designation}</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-300">{r.company}</td>
                                            <td className="py-2.5 px-3 text-slate-400">{r.district}</td>
                                            <td className="py-2.5 px-3 font-mono text-xs text-slate-300">
                                                {r.phone}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {r.scanCount > 0 ? (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                                                        Checked In ({r.scanCount})
                                                    </span>
                                                ) : (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                                        Registered
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRegistration(r.id, r.passId)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer"
                                                    title="Delete registration"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 3: Attendance Viewer */}
                {activeTab === "attendance" && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Scanned Attendance Log</h2>
                            <a
                                href="/api/agm/export?type=scans"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                                <Download className="h-4 w-4" />
                                Export Attendance CSV
                            </a>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                                        <th className="py-3 px-3">Name</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">District</th>
                                        <th className="py-3 px-3">Phone</th>
                                        <th className="py-3 px-3">Scanned At</th>
                                        <th className="py-3 px-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/70">
                                    {scans.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-800/40">
                                            <td className="py-2.5 px-3 font-medium text-white">{s.name}</td>
                                            <td className="py-2.5 px-3 text-slate-300">{s.company}</td>
                                            <td className="py-2.5 px-3 text-slate-400">{s.district || "-"}</td>
                                            <td className="py-2.5 px-3 font-mono text-xs text-slate-300">
                                                {s.phone || "-"}
                                            </td>
                                            <td className="py-2.5 px-3 text-xs text-slate-400">
                                                {new Date(s.scannedAt).toLocaleString()}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteScan(s.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer"
                                                    title="Delete scan"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 4: Scanner Users */}
                {activeTab === "scannerUsers" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-orange-400" />
                                <h2 className="text-lg font-bold text-white">Create / Update Scanner User</h2>
                            </div>
                            <p className="text-xs text-slate-400">
                                Scanner users can log in at <span className="font-mono text-orange-300">/agm/scanner</span> (no admin access, scan &amp; 50×50mm sticker print only).
                            </p>
                            <form onSubmit={handleSaveScannerUser} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="e.g. desk1"
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimum 4 characters"
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Station Label
                                    </label>
                                    <input
                                        type="text"
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
                                        placeholder="Desk 1"
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                                    />
                                </div>
                                {userMsg && (
                                    <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
                                        {userMsg}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-sm cursor-pointer"
                                >
                                    Save Scanner User
                                </button>
                            </form>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <h2 className="text-lg font-bold text-white">Active Scanner Accounts</h2>
                            <div className="divide-y divide-slate-800">
                                {scannerUsers.map((u) => (
                                    <div key={u.username} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-mono text-sm font-bold text-white">
                                                {u.username}
                                            </div>
                                            <div className="text-xs text-slate-400">{u.label}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteScannerUser(u.username)}
                                            className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer"
                                            title="Remove scanner user"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
