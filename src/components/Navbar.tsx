"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="border-b border-white/10 bg-slate-950/75 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                <div className="hidden lg:flex items-center gap-6">
                    <Link href="/" className="relative text-sm font-semibold tracking-wide text-white/90 hover:text-white group transition-all duration-300">
                        Home
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                    </Link>
                    <Link href="/#programs" className="relative text-sm font-semibold tracking-wide text-white/90 hover:text-white group transition-all duration-300">
                        Programs
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
                    </Link>
                    <Link href="/#about" className="relative text-sm font-semibold tracking-wide text-white/90 hover:text-white group transition-all duration-300">
                        About
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
                    </Link>
                    <Link href="/#committee" className="relative text-sm font-semibold tracking-wide text-white/90 hover:text-white group transition-all duration-300">
                        Committee
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                    </Link>
                    <Link href="/gallery" className="relative text-sm font-semibold tracking-wide text-white/90 hover:text-white group transition-all duration-300">
                        Gallery
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                    </Link>
                    <Link href="/#benefits" className="relative text-sm font-semibold tracking-wide text-white/90 hover:text-white group transition-all duration-300">
                        Benefits
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
                    </Link>
                    <Link href="/#contact" className="relative text-sm font-semibold tracking-wide text-white/90 hover:text-white group transition-all duration-300 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                        Contact
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button className="bg-green-600 hover:bg-green-700 text-white border-0 hidden sm:inline-flex">Member Login</Button>
                    </Link>
                    <Link href="/register">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 hidden sm:inline-flex">Join Now</Button>
                    </Link>
                    <div className="lg:hidden">
                        <Button variant="ghost" size="icon" className="text-white" onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div >

            {/* Mobile Menu */}
            {
                isOpen && (
                    <div className="lg:hidden bg-slate-900 border-t border-white/10 absolute top-16 left-0 right-0 p-4 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-5">
                        <Link href="/" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white hover:bg-blue-500/10 border-l-2 border-transparent hover:border-blue-400 transition-all duration-200 p-2 pl-4 rounded-r" onClick={() => setIsOpen(false)}>
                            Home
                        </Link>
                        <Link href="/#programs" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white hover:bg-orange-500/10 border-l-2 border-transparent hover:border-orange-400 transition-all duration-200 p-2 pl-4 rounded-r" onClick={() => setIsOpen(false)}>
                            Programs
                        </Link>
                        <Link href="/#about" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white hover:bg-orange-500/10 border-l-2 border-transparent hover:border-orange-400 transition-all duration-200 p-2 pl-4 rounded-r" onClick={() => setIsOpen(false)}>
                            About
                        </Link>
                        <Link href="/#committee" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white hover:bg-blue-500/10 border-l-2 border-transparent hover:border-blue-400 transition-all duration-200 p-2 pl-4 rounded-r" onClick={() => setIsOpen(false)}>
                            Committee
                        </Link>
                        <Link href="/gallery" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white hover:bg-green-500/10 border-l-2 border-transparent hover:border-green-400 transition-all duration-200 p-2 pl-4 rounded-r" onClick={() => setIsOpen(false)}>
                            Gallery
                        </Link>
                        <Link href="/#benefits" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white hover:bg-orange-500/10 border-l-2 border-transparent hover:border-orange-400 transition-all duration-200 p-2 pl-4 rounded-r" onClick={() => setIsOpen(false)}>
                            Benefits
                        </Link>
                        <Link href="/#contact" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white hover:bg-blue-500/10 border-l-2 border-transparent hover:border-blue-400 transition-all duration-200 p-2 pl-4 rounded-r" onClick={() => setIsOpen(false)}>
                            Contact
                        </Link>
                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                <Button className="bg-green-600 hover:bg-green-700 text-white border-0 w-full justify-start">Member Login</Button>
                            </Link>
                            <Link href="/register" onClick={() => setIsOpen(false)}>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 w-full">Join Now</Button>
                            </Link>
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
