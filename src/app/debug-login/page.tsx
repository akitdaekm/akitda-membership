"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugLogin() {
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState("");
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Login Diagnostics Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        This page logs every interaction to help debug input issues.
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold">1. Identifier Input</label>
                        <Input
                            placeholder="Type Identifier here..."
                            value={identifier}
                            onChange={(e) => {
                                setIdentifier(e.target.value);
                                addLog(`Identifier Change: ${e.target.value}`);
                            }}
                            className="bg-white border-2 border-slate-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-bold">2. OTP Input (Type 'tel')</label>
                        <Input
                            type="tel"
                            placeholder="Type OTP here..."
                            value={otp}
                            maxLength={6}
                            onChange={(e) => {
                                setOtp(e.target.value);
                                addLog(`OTP Change: ${e.target.value}`);
                            }}
                            onKeyDown={(e) => {
                                addLog(`Key Down: ${e.key}`);
                            }}
                            className="text-2xl font-bold tracking-widest h-16 border-2 border-slate-400"
                        />
                    </div>

                    <div className="mt-8 border-t pt-4">
                        <h3 className="font-bold mb-2">Live Logs:</h3>
                        <div className="bg-slate-900 text-green-400 p-4 rounded h-64 overflow-auto font-mono text-xs">
                            {logs.length === 0 ? "Interact with inputs to see logs..." : logs.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
