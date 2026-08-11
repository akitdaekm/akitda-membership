"use client";

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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    identifier: z.string().min(3, "Enter your Mobile Number, Email, or Membership ID"),
});

const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
});

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
                        : `Enter the OTP sent to your registered contact for ${identifier}`
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
                                        <FormLabel>One Time Password</FormLabel>
                                        <FormControl>
                                            <div className="flex justify-center">
                                                <InputOTP
                                                    maxLength={6}
                                                    {...field}
                                                >
                                                    <InputOTPGroup className="gap-2">
                                                        <InputOTPSlot index={0} className="rounded-md border-blue-500/30 bg-white/5 text-blue-100" />
                                                        <InputOTPSlot index={1} className="rounded-md border-blue-500/30 bg-white/5 text-blue-100" />
                                                        <InputOTPSlot index={2} className="rounded-md border-blue-500/30 bg-white/5 text-blue-100" />
                                                    </InputOTPGroup>
                                                    <InputOTPSeparator />
                                                    <InputOTPGroup className="gap-2">
                                                        <InputOTPSlot index={3} className="rounded-md border-blue-500/30 bg-white/5 text-blue-100" />
                                                        <InputOTPSlot index={4} className="rounded-md border-blue-500/30 bg-white/5 text-blue-100" />
                                                        <InputOTPSlot index={5} className="rounded-md border-blue-500/30 bg-white/5 text-blue-100" />
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
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
