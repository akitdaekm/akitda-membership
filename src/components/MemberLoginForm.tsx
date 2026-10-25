"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    identifier: z.string().min(3, "Enter your Mobile Number, Email, or Membership ID"),
});

// 6-box OTP component: Native visible uncontrolled inputs for instant typing feedback & zero lag
function SixBoxOtpInput({
    onOtpChange,
}: {
    onOtpChange: (val: string) => void;
}) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Automatically focus on the first slot when mounted
        const timer = setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const emitChange = () => {
        const full = inputRefs.current.map((el) => el?.value || "").join("");
        onOtpChange(full);
    };

    const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
        // Keep only the most recently typed digit
        e.target.value = val ? val.slice(-1) : "";

        emitChange();

        // If a digit was entered, immediately jump to the next input box
        if (e.target.value && index < 5) {
            inputRefs.current[index + 1]?.focus();
            inputRefs.current[index + 1]?.select();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (!e.currentTarget.value && index > 0) {
                const prev = inputRefs.current[index - 1];
                if (prev) {
                    prev.value = "";
                    prev.focus();
                    emitChange();
                }
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
        if (!text) return;

        for (let i = 0; i < 6; i++) {
            if (inputRefs.current[i]) {
                inputRefs.current[i]!.value = text[i] || "";
            }
        }
        emitChange();
        const focusIndex = Math.min(text.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handlePasteClick = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const digits = text.replace(/[^0-9]/g, "").slice(0, 6);
            if (!digits) return;
            for (let i = 0; i < 6; i++) {
                if (inputRefs.current[i]) {
                    inputRefs.current[i]!.value = digits[i] || "";
                }
            }
            emitChange();
            const focusIndex = Math.min(digits.length, 5);
            inputRefs.current[focusIndex]?.focus();
        } catch {
            // Clipboard access not granted or not supported on this browser
        }
    };

    return (
        <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <React.Fragment key={idx}>
                        {idx === 3 && (
                            <span className="text-blue-300 font-bold text-2xl select-none px-1">-</span>
                        )}
                        <input
                            key={idx}
                            ref={(el) => { inputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            defaultValue=""
                            onChange={(e) => handleInput(idx, e)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            onPaste={handlePaste}
                            onFocus={(e) => e.target.select()}
                            style={{
                                color: "#ffffff",
                                WebkitTextFillColor: "#ffffff",
                                backgroundColor: "#0f172a",
                                caretColor: "#38bdf8",
                            }}
                            className="w-11 h-14 sm:w-12 sm:h-14 text-center text-3xl font-extrabold border-2 border-blue-400 rounded-xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/40 outline-none transition-all shadow-lg text-white"
                        />
                    </React.Fragment>
                ))}
            </div>

            <button
                type="button"
                onClick={handlePasteClick}
                className="text-xs text-blue-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 pt-1 cursor-pointer underline underline-offset-4"
            >
                📋 Paste OTP from Clipboard
            </button>
        </div>
    );
}

export function MemberLoginForm() {
    const router = useRouter();
    const [step, setStep] = useState<"IDENTIFIER" | "OTP">("IDENTIFIER");
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [otpError, setOtpError] = useState("");

    const formIdent = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { identifier: "" },
    });

    async function onIdentifierSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/otp/generate", {
                method: "POST",
                body: JSON.stringify(values),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                setIdentifier(values.identifier);
                setStep("OTP");
                setOtpCode("");
                setOtpError("");
            } else {
                const data = await res.json();
                formIdent.setError("identifier", { message: data.message || "User not found" });
            }
        } catch {
            formIdent.setError("identifier", { message: "Network error" });
        } finally {
            setLoading(false);
        }
    }

    async function handleOtpVerify(e?: React.FormEvent) {
        if (e) e.preventDefault();

        if (!otpCode || otpCode.length !== 6) {
            setOtpError("OTP must be 6 digits");
            return;
        }

        setOtpError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/otp/verify", {
                method: "POST",
                body: JSON.stringify({ identifier, otp: otpCode }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                const data = await res.json().catch(() => ({}));
                setOtpError(data.message || "Invalid OTP. Please check and try again.");
            }
        } catch (error: unknown) {
            console.error("Login Error:", error);
            const message = error instanceof Error ? error.message : "Login failed. Please try again.";
            setOtpError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto border border-blue-900/50 shadow-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af]">
            <CardHeader className="bg-white/5 border-b border-blue-400/20 text-white backdrop-blur-sm">
                <CardTitle className="text-xl font-bold tracking-wide">Member Login</CardTitle>
                <CardDescription className="text-blue-200">
                    {step === "IDENTIFIER"
                        ? "Enter your registered Mobile, Email, or Membership ID to login."
                        : `Enter the OTP sent to your WhatsApp / mobile for ${identifier}`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {step === "IDENTIFIER" ? (
                    <Form {...formIdent}>
                        <form onSubmit={formIdent.handleSubmit(onIdentifierSubmit)} className="space-y-6">
                            <FormField
                                control={formIdent.control}
                                name="identifier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile / Email / Membership ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 9876543210" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500 transition-all font-semibold tracking-wide" disabled={loading}>
                                {loading ? "Sending OTP..." : "Get OTP"}
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <form onSubmit={handleOtpVerify} className="space-y-6">
                        <div>
                            <label className="text-center block text-sm font-medium text-white mb-2">
                                One Time Password
                            </label>
                            <SixBoxOtpInput
                                onOtpChange={(val) => {
                                    setOtpCode(val);
                                    if (val.length === 6) {
                                        setOtpError("");
                                    }
                                }}
                            />
                            {otpError && (
                                <p className="text-center text-sm font-medium text-red-400 mt-2">
                                    {otpError}
                                </p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500 transition-all font-semibold tracking-wide cursor-pointer"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify & Login"}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full hover:bg-white/10 hover:text-white cursor-pointer"
                            onClick={() => {
                                setStep("IDENTIFIER");
                                setOtpError("");
                                setOtpCode("");
                            }}
                            type="button"
                        >
                            Back
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
