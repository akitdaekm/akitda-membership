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
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export default function AdminLogin() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [failedAttempts, setFailedAttempts] = useState(0);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Forgot Password States
    const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState<1 | 2>(1);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp] = useState("");
    const [forgotNewPassword, setForgotNewPassword] = useState("");
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState("");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                body: JSON.stringify(values),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                setFailedAttempts(0);
                router.push("/admin/dashboard");
            } else {
                const data = await res.json().catch(() => null);
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                if (newAttempts >= 3 && data?.emailExists) {
                    if (data.role === "SUPER_ADMIN") {
                        setError("Too many failed attempts. Opening password reset.");
                        setForgotEmail(values.email);
                        setIsForgotDialogOpen(true);
                    } else {
                        setError("Too many failed attempts. Please contact the administrator to reset your password.");
                    }
                } else {
                    setError("Invalid credentials");
                }
            }
        } catch (e) {
            setError("An error occurred");
        }
    }

    async function handleRequestOtp(e: React.FormEvent) {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");

        if (!forgotEmail) {
            setForgotError("Email is required");
            return;
        }

        try {
            const res = await fetch("/api/admin/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail })
            });
            const data = await res.json();

            if (res.ok) {
                setForgotSuccess("If registered as Superadmin, an OTP has been sent.");
                setForgotStep(2);
            } else {
                setForgotError(data.message || "Failed to request OTP");
            }
        } catch (err) {
            setForgotError("An error occurred trying to request OTP.");
        }
    }

    async function handleVerifyOtpAndReset(e: React.FormEvent) {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");

        if (!forgotOtp || !forgotNewPassword || !forgotConfirmPassword) {
            setForgotError("All fields are required");
            return;
        }

        if (forgotNewPassword !== forgotConfirmPassword) {
            setForgotError("Passwords do not match");
            return;
        }

        try {
            const res = await fetch("/api/admin/reset-password-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: forgotEmail,
                    otp: forgotOtp,
                    newPassword: forgotNewPassword
                })
            });
            const data = await res.json();

            if (res.ok) {
                setForgotSuccess("Password reset successfully! You can now log in.");
                setTimeout(() => {
                    setIsForgotDialogOpen(false);
                    setForgotStep(1);
                    setForgotEmail("");
                    setForgotOtp("");
                    setForgotNewPassword("");
                    setForgotConfirmPassword("");
                    setForgotSuccess("");
                }, 2000);
            } else {
                setForgotError(data.message || "Failed to reset password");
            }
        } catch (err) {
            setForgotError("An error occurred verifying your OTP.");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1120] relative overflow-hidden font-sans">
            {/* Background mesh glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <Card className="w-[400px] relative z-10 bg-[#1e293b]/80 backdrop-blur-xl border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] text-slate-200">
                <CardHeader className="flex flex-col items-center space-y-4 pb-8 pt-8">
                    <div className="relative h-20 w-40 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <Image
                            src="/akitda-logo.png"
                            alt="AKITDA Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        Admin Portal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-blue-300">Email Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="admin@akitda.com"
                                                className="bg-[#0f172a]/50 border-blue-500/30 focus-visible:ring-blue-500/50 text-white placeholder:text-slate-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-blue-300">Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                className="bg-[#0f172a]/50 border-blue-500/30 focus-visible:ring-blue-500/50 text-white"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            {error && <p className="text-red-400 text-sm font-medium text-center bg-red-900/20 py-2 rounded-lg border border-red-900/50">{error}</p>}
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all mt-4 rounded-xl">
                                Secure Login
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <Dialog open={isForgotDialogOpen} onOpenChange={(open) => {
                                setIsForgotDialogOpen(open);
                                if (!open) {
                                    setForgotStep(1);
                                    setForgotError("");
                                    setForgotSuccess("");
                                    setForgotOtp("");
                                    setForgotNewPassword("");
                                    setForgotConfirmPassword("");
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <button className="text-sm text-blue-400 hover:text-cyan-300 transition-colors font-medium">
                                        Forgot Password?
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#1e293b] border-blue-800/40 text-slate-200">
                                    <DialogHeader>
                                        <DialogTitle className="text-white text-xl">Reset Password</DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            {forgotStep === 1
                                                ? "Enter your Superadmin email address to receive an OTP."
                                                : "Enter the 6-digit OTP sent to your email, along with your new password."}
                                        </DialogDescription>
                                    </DialogHeader>

                                    {forgotStep === 1 ? (
                                        <form onSubmit={handleRequestOtp} className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <FormLabel className="text-blue-300">Email Address</FormLabel>
                                                <Input
                                                    type="email"
                                                    required
                                                    value={forgotEmail}
                                                    onChange={e => setForgotEmail(e.target.value)}
                                                    placeholder="admin@akitda.com"
                                                    className="bg-[#0f172a]/50 border-blue-500/30 text-white"
                                                />
                                            </div>
                                            {forgotError && <p className="text-red-400 text-sm font-medium">{forgotError}</p>}
                                            {forgotSuccess && <p className="text-green-400 text-sm font-medium">{forgotSuccess}</p>}
                                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                                                Send OTP
                                            </Button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleVerifyOtpAndReset} className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <FormLabel className="text-blue-300">6-Digit OTP</FormLabel>
                                                <Input
                                                    type="text"
                                                    required
                                                    value={forgotOtp}
                                                    onChange={e => setForgotOtp(e.target.value)}
                                                    placeholder="• • • • • •"
                                                    className="bg-[#0f172a]/50 border-blue-500/30 text-white tracking-widest text-center text-lg"
                                                    maxLength={6}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <FormLabel className="text-blue-300">New Password</FormLabel>
                                                <Input
                                                    type="password"
                                                    required
                                                    value={forgotNewPassword}
                                                    onChange={e => setForgotNewPassword(e.target.value)}
                                                    className="bg-[#0f172a]/50 border-blue-500/30 text-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <FormLabel className="text-blue-300">Confirm New Password</FormLabel>
                                                <Input
                                                    type="password"
                                                    required
                                                    value={forgotConfirmPassword}
                                                    onChange={e => setForgotConfirmPassword(e.target.value)}
                                                    className="bg-[#0f172a]/50 border-blue-500/30 text-white"
                                                />
                                            </div>
                                            {forgotError && <p className="text-red-400 text-sm font-medium">{forgotError}</p>}
                                            {forgotSuccess && <p className="text-green-400 text-sm font-medium">{forgotSuccess}</p>}
                                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                                                Verify & Reset Password
                                            </Button>
                                        </form>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
