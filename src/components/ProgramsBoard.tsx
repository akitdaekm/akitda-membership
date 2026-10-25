"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Pause,
    Play,
    Sparkles,
} from "lucide-react";
import type { ProgramItem } from "@/lib/programs";

const AUTO_SLIDE_MS = 5500;

export function ProgramsBoard({ programs }: { programs: ProgramItem[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isPaused, setIsPaused] = useState(false);

    const total = programs?.length || 0;

    useEffect(() => {
        if (total <= 1 || isPaused) return;
        const timer = setInterval(() => {
            setDirection(1);
            setActiveIndex((prev) => (prev + 1) % total);
        }, AUTO_SLIDE_MS);
        return () => clearInterval(timer);
    }, [total, isPaused, activeIndex]);

    if (!programs || total === 0) return null;

    const current = programs[activeIndex] || programs[0];

    const goNext = () => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % total);
    };

    const goPrev = () => {
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + total) % total);
    };

    const goToSlide = (idx: number) => {
        setDirection(idx > activeIndex ? 1 : -1);
        setActiveIndex(idx);
    };

    return (
        <section
            id="programs"
            className="relative py-6 md:py-8 bg-gradient-to-b from-[#0B1120] via-slate-900 to-slate-950 text-white overflow-hidden border-t border-blue-500/20"
        >
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[300px] bg-blue-600/15 rounded-full blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 right-10 w-[300px] h-[200px] bg-orange-500/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5 max-w-6xl mx-auto">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-300 text-xs font-bold uppercase tracking-wider mb-2 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <Megaphone className="h-3.5 w-3.5 text-orange-400" />
                            Association News &amp; Upcoming Programs
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                            Upcoming Programs &amp; Announcements
                        </h2>
                    </div>

                    {/* Counter & Playback Controls */}
                    {total > 1 && (
                        <div className="flex items-center gap-2.5 self-start md:self-auto">
                            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full">
                                Program {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsPaused((p) => !p)}
                                aria-label={isPaused ? "Resume slideshow" : "Pause slideshow"}
                                className="h-8 w-8 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
                                title={isPaused ? "Play" : "Pause"}
                            >
                                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={goPrev}
                                aria-label="Previous program"
                                className="h-8 w-8 rounded-full bg-slate-800/90 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 flex items-center justify-center text-white transition shadow"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label="Next program"
                                className="h-8 w-8 rounded-full bg-slate-800/90 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 flex items-center justify-center text-white transition shadow"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Main One-by-One Board Card */}
                <div
                    className="max-w-6xl mx-auto relative rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-950/80 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Animated Progress Bar at top */}
                    {total > 1 && (
                        <div className="h-1 w-full bg-slate-800 overflow-hidden">
                            <motion.div
                                key={`${current.id}-${isPaused ? "paused" : "playing"}`}
                                initial={{ width: "0%" }}
                                animate={{ width: isPaused ? "0%" : "100%" }}
                                transition={{
                                    duration: isPaused ? 0 : AUTO_SLIDE_MS / 1000,
                                    ease: "linear",
                                }}
                                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500"
                            />
                        </div>
                    )}

                    <div className="relative min-h-[260px] md:min-h-[300px] flex items-stretch">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={current.id}
                                custom={direction}
                                initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
                                transition={{ duration: 0.45, ease: "easeOut" }}
                                className="w-full grid md:grid-cols-12 gap-0"
                            >
                                {/* Left / Top Visual Poster Column */}
                                <div className="md:col-span-5 relative min-h-[200px] md:min-h-[300px] bg-slate-950 overflow-hidden flex items-center justify-center">
                                    {current.posterUrl ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={current.posterUrl}
                                                alt={current.title}
                                                className="w-full h-full object-cover min-h-[200px] md:min-h-[300px] transform hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full min-h-[200px] md:min-h-[300px] bg-gradient-to-br from-blue-900/60 via-slate-900 to-orange-900/40 flex flex-col items-center justify-center p-6 text-center">
                                            <div className="h-16 w-16 rounded-2xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center mb-3 shadow-lg">
                                                <Calendar className="h-8 w-8 text-orange-400" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest text-orange-300">
                                                AKITDA Official Notice
                                            </span>
                                        </div>
                                    )}

                                    {/* Floating Category Badge on Poster */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-600 text-white shadow-lg border border-orange-400/50">
                                            <Sparkles className="h-3 w-3" />
                                            {current.category || "Upcoming Program"}
                                        </span>
                                    </div>
                                </div>

                                {/* Right Content Column */}
                                <div className="md:col-span-7 p-5 sm:p-6 md:p-8 flex flex-col justify-between">
                                    <div>
                                        {/* Date & Venue Pills */}
                                        <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                                            {current.date && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-200 text-xs sm:text-sm font-semibold">
                                                    <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                                    <span>{current.date}</span>
                                                </div>
                                            )}
                                            {current.venue && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs sm:text-sm font-semibold">
                                                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                                    <span>{current.venue}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Program Title */}
                                        <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2.5">
                                            {current.title}
                                        </h3>

                                        {/* Description */}
                                        {current.description && (
                                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
                                                {current.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Bottom Indicator Dots & Quick Navigation */}
                                    <div className="pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-1.5">
                                            {programs.map((item, idx) => {
                                                const isActive = idx === activeIndex;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => goToSlide(idx)}
                                                        aria-label={`View program ${idx + 1}: ${item.title}`}
                                                        className={`h-2 rounded-full transition-all duration-300 ${
                                                            isActive
                                                                ? "w-8 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                                                                : "w-2 bg-slate-700 hover:bg-slate-500"
                                                        }`}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {total > 1 && (
                                            <button
                                                type="button"
                                                onClick={goNext}
                                                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 transition group"
                                            >
                                                Next Program
                                                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
