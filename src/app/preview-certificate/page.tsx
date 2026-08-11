"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MembershipCertificate } from "@/components/Certificate";

const PDFViewer = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
    { ssr: false }
);

export default function PreviewCertificate() {
    const [signatures, setSignatures] = useState<{
        presidentSignatureUrl?: string;
        secretarySignatureUrl?: string;
        treasurerSignatureUrl?: string;
        officialSealUrl?: string;
    }>({});

    useEffect(() => {
        fetch("/api/settings/signatures")
            .then((res) => res.json())
            .then((data) => setSignatures(data))
            .catch((err) => console.error("Failed to load signatures", err));
    }, []);

    return (
        <div style={{ width: "100vw", height: "100vh", backgroundColor: "#f3f4f6" }}>
            <PDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
                <MembershipCertificate 
                    memberName="Raj Infotech"
                    membershipId="AKEKM007"
                    financialYear="2026-2027"
                    presidentSignatureUrl={signatures.presidentSignatureUrl}
                    secretarySignatureUrl={signatures.secretarySignatureUrl}
                    treasurerSignatureUrl={signatures.treasurerSignatureUrl}
                    officialSealUrl={signatures.officialSealUrl}
                />
            </PDFViewer>
        </div>
    );
}




