"use client";

import React, { useCallback, useEffect, useState } from "react";
import { LogOut, QrCode, ScanLine } from "lucide-react";
import AgmScannerStation from "@/components/AgmScannerStation";

export default function AgmScannerOnlyPage() {
    const [authState, setAuthState] = useState<"loading" | "authed" | "unauthed">("loading");
    const [username, setUsername] = useState("");
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);

    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch("/api/agm/scanner-login");
            if (res.ok) {
                const data = await res.json();
                setUsername(data.username || "scanner");
                setAuthState("authed");
            } else {
                setAuthState("unauthed");
            }
        } catch {
            setAuthState("unauthed");
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        setLoggingIn(true);
        try {
            const res = await fetch("/api/agm/scanner-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: loginUsername,
                    password: loginPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginError(data.message || "Invalid username or password");
                return;
            }
            setLoginPassword("");
            setUsername(data.username || loginUsername);
            setAuthState("authed");
        } catch {
            setLoginError("Network error while signing in.");
        } finally {
            setLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/agm/scanner-login", { method: "DELETE" });
        setAuthState("unauthed");
    };

    if (authState === "loading") {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
                Loading Scanner Station...
            </div>
        );
    }

    if (authState === "unauthed") {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5 shadow-2xl">
                    <div className="text-center space-y-2">
                        <div className="mx-auto h-12 w-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                            <ScanLine className="h-6 w-6" />
                        </div>
                        <h1 className="text-xl font-bold text-white">AGM Scanner Login</h1>
                        <p className="text-xs text-slate-400">
                            Scan &amp; Print Station • AKITDA General Body 2026
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Scanner Username
                            </label>
                            <input
                                type="text"
                                required
                                autoFocus
                                value={loginUsername}
                                onChange={(e) => setLoginUsername(e.target.value)}
                                placeholder="scanner"
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
                            {loggingIn ? "Signing In..." : "Open Scanner"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                                AKITDA General Body • 15th December 2026
                            </div>
                            <h1 className="text-xl font-bold text-white">
                                QR Check-In &amp; 50×50mm Sticker Station
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                            User: <strong className="text-slate-200">{username}</strong>
                        </span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Sign Out
                        </button>
                    </div>
                </div>

                <AgmScannerStation onUnauthorized={() => setAuthState("unauthed")} />
            </div>
        </div>
    );
}
