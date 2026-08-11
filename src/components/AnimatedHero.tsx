"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AnimatedHero() {
    return (
        <section className="relative text-white overflow-hidden pt-4 pb-12 lg:pt-6 lg:pb-16 bg-[#0B1120]">
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0B1120] to-[#0B1120] z-0" />

            {/* Animated Ambient Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 50, 0],
                    y: [0, -50, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-500/20 rounded-full blur-[100px] md:blur-[120px] pointer-events-none z-0"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, -40, 0],
                    y: [0, 40, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-cyan-500/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none z-0"
            />

            {/* Abstract Curved Background */}
            <div className="absolute inset-x-0 bottom-0 z-0 h-[80%] opacity-30 mix-blend-screen pointer-events-none">
                <svg className="absolute w-full h-full text-[#1e3a8a]" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,100 C0,40 50,20 100,50 L100,100 Z" fill="currentColor" />
                </svg>
            </div>

            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center mt-4">

                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full flex flex-col items-center justify-center gap-1 mb-4"
                >
                    <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-flex items-center justify-center drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]"
                    >
                        <Image
                            src="/akitda-logo.png"
                            alt="AKITDA Logo"
                            width={200}
                            height={100}
                            className="object-contain h-32 md:h-40 w-auto"
                            priority
                        />
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
                >
                    <motion.h2
                        animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                        className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-white to-slate-300 bg-[length:200%_auto] drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] text-center max-w-6xl leading-tight tracking-tight mb-4"
                    >
                        All Kerala IT Dealers Association
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    className="relative overflow-hidden inline-block px-8 py-2.5 mb-6 rounded-full bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 border border-orange-400 text-white font-bold text-lg md:text-xl shadow-[0_0_25px_rgba(234,88,12,0.5)] tracking-wide"
                >
                    <span className="relative z-10 drop-shadow-md">Ernakulam District Committee</span>
                    <motion.div
                        animate={{ x: ["-200%", "300%"] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1.5 }}
                        className="absolute inset-0 z-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12"
                    />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.15] text-white drop-shadow-lg"
                >
                    Empowering IT<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Dealers & Professionals</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-lg md:text-2xl max-w-3xl mb-10 text-blue-100/80 leading-relaxed font-light drop-shadow-sm"
                >
                    AKITDA is the premier body representing the IT hardware and solutions industry in Kerala. We stand for unity, ethics and collective progress.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="flex flex-col sm:flex-row gap-6 mb-12"
                >
                    <Link href="/register" className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-200"></div>
                        <Button size="lg" className="relative h-14 px-10 text-lg bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all hover:scale-105 border border-blue-400/50">
                            Join AKITDA
                        </Button>
                    </Link>
                    <Link href="/login" className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-200"></div>
                        <Button size="lg" className="relative h-14 px-10 text-lg bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-all hover:scale-105 border border-green-400/50">
                            Member Login
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
