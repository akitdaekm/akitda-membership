import { Navbar } from "@/components/Navbar";
import { MemberLoginForm } from "@/components/MemberLoginForm";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#0B1120] font-sans">
            <Navbar />
            <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
                <div className="mb-10 flex flex-col items-center">
                    <div className="mb-6 inline-flex items-center justify-center drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <Image
                            src="/akitda-logo.png"
                            alt="AKITDA Logo"
                            width={160}
                            height={80}
                            className="object-contain h-20 w-auto"
                            priority
                        />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        Member Portal
                    </h1>
                    <p className="text-blue-200/80 mt-2 font-medium tracking-wide">Access your digital membership certificate</p>
                </div>
                <div className="w-full max-w-md dark text-slate-200">
                    <MemberLoginForm />
                </div>
            </div>
        </div>
    );
}
