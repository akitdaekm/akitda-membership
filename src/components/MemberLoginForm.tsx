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

// 6-box OTP component: Independent state, guaranteed visible digits, auto-advance
function SixBoxOtpInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const [digits, setDigits] = useState<string[]>(() => {
        const arr = (value || "").slice(0, 6).split("");
        while (arr.length < 6) arr.push("");
        return arr;
    });

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus first slot when component mounts
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (!value) {
            setDigits(["", "", "", "", "", ""]);
        } else if (value !== digits.join("")) {
            const arr = value.slice(0, 6).split("");
            while (arr.length < 6) arr.push("");
            setDigits(arr);
        }
    }, [value]);

    const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
        const char = val ? val.slice(-1) : "";

        const nextDigits = [...digits];
        nextDigits[index] = char;
        setDigits(nextDigits);
        onChange(nextDigits.join(""));

        // If a number was typed, move to next slot automatically
        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (!digits[index] && index > 0) {
                const nextDigits = [...digits];
                nextDigits[index - 1] = "";
                setDigits(nextDigits);
                onChange(nextDigits.join(""));
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
        if (pasted) {
            const nextDigits = pasted.split("");
            while (nextDigits.length < 6) nextDigits.push("");
            setDigits(nextDigits);
            onChange(pasted);
            const focusTarget = Math.min(pasted.length, 5);
            inputRefs.current[focusTarget]?.focus();
        }
    };

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
                <React.Fragment key={idx}>
                    {idx === 3 && (
                        <span className="text-blue-300 font-bold text-2xl select-none px-1">-</span>
                    )}
                    <input
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digits[idx]}
                        onChange={(e) => handleInput(idx, e)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        style={{
                            color: "#ffffff",
                            WebkitTextFillColor: "#ffffff",
                            backgroundColor: "#0f172a",
                            caretColor: "#38bdf8",
                        }}
                        className="w-11 h-14 sm:w-12 sm:h-14 text-center text-3xl font-extrabold border-2 border-blue-400 rounded-xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/40 outline-none transition-all shadow-lg select-text"
                    />
                </React.Fragment>
            ))}
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
                                                onChange={field.onChange}
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
