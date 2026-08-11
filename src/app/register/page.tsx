import { Navbar } from "@/components/Navbar";
import { RegistrationForm } from "@/components/RegistrationForm";
import Image from "next/image";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-[#0B1120] font-sans pb-20">
            <Navbar />

            {/* Header */}
            <div className="py-12 md:py-20 text-center text-white bg-[#0B1120]">
                <div className="container mx-auto px-4 flex flex-col items-center">
                    <div className="mb-6 inline-flex items-center justify-center drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <Image src="/akitda-logo.png" alt="AKITDA Logo" width={120} height={120} className="h-24 w-auto object-contain" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        AKITDA Membership Registration
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Join the premier association for IT dealers in Kerala. Please fill out the form below to apply for membership.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 -mt-10">
                <div className="max-w-4xl mx-auto dark text-slate-200">
                    <RegistrationForm />
                </div>
            </div>
        </div>
    );
}
