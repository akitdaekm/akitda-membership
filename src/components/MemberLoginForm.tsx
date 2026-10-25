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

const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
});

// Single overlay OTP component: Guarantees 100% synchronization with form, mobile autofill, and paste
function SixBoxOtpInput({
    value = "",
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        // Automatically focus on mount
        inputRef.current?.focus();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
        onChange(cleaned);
    };

    return (
        <div
            className="relative py-2 flex items-center justify-center cursor-text"
            onClick={() => inputRef.current?.focus()}
        >
            {/* The single true input: perfectly captures typing, mobile keyboard, clipboard paste, autofill */}
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                value={value || ""}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer pointer-events-auto text-transparent"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    zIndex: 20,
                    cursor: "text",
                }}
                autoFocus
            />

            {/* Visual 6 boxes rendering directly from the single source of truth `value` */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 pointer-events-none">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const char = (value || "")[idx] || "";
                    // Active slot is the one currently waiting for input
                    const isCurrentSlot = isFocused && (idx === (value || "").length || (idx === 5 && (value || "").length === 6));

                    return (
                        <React.Fragment key={idx}>
                            {idx === 3 && (
                                <span className="text-blue-300 font-bold text-2xl px-1 select-none">-</span>
                            )}
                            <div
                                style={{
                                    backgroundColor: "#0f172a",
                                    color: "#ffffff",
                                }}
                                className={`w-11 h-14 sm:w-12 sm:h-14 flex items-center justify-center text-3xl font-extrabold rounded-xl border-2 transition-all shadow-lg select-none ${
                                    isCurrentSlot
                                        ? "border-cyan-400 ring-4 ring-cyan-500/40 scale-105"
                                        : char
                                        ? "border-blue-400 shadow-blue-500/20"
                                        : "border-blue-900/60"
                                }`}
                            >
                                {char ? (
                                    <span className="text-white drop-shadow font-mono">{char}</span>
                                ) : isCurrentSlot ? (
                                    <span className="inline-block w-0.5 h-7 bg-cyan-400 animate-pulse rounded" />
                                ) : (
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-900/50" />
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

export function MemberLoginForm() {
    const router = useRouter();
    const [step, setStep] = useState<"IDENTIFIER" | "OTP">("IDENTIFIER");
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);

    const formIdent = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { identifier: "" },
    });

    const formOtp = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: "" },
        mode: "onSubmit",
        reValidateMode: "onSubmit",
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

    async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/otp/verify", {
                method: "POST",
                body: JSON.stringify({ identifier, otp: values.otp }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                formOtp.setError("otp", { message: "Invalid OTP" });
            }
        } catch (error: unknown) {
            console.error("Login Error:", error);
            const message = error instanceof Error ? error.message : "Login failed. Please try again.";
            formOtp.setError("otp", { message });
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
                    <Form {...formOtp}>
                        <form onSubmit={formOtp.handleSubmit(onOtpSubmit)} className="space-y-6">
                            <FormField
                                control={formOtp.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-center block">One Time Password</FormLabel>
                                        <FormControl>
                                            <SixBoxOtpInput
                                                value={field.value}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    if (val.length === 6) {
                                                        formOtp.clearErrors("otp");
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-center" />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500 transition-all font-semibold tracking-wide" disabled={loading}>
                                {loading ? "Verifying..." : "Verify & Login"}
                            </Button>
                            <Button variant="ghost" className="w-full hover:bg-white/10 hover:text-white" onClick={() => setStep("IDENTIFIER")} type="button">
                                Back
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
