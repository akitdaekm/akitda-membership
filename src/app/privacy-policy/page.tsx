import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-10 space-y-6">
          <div>
            <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">
              All Kerala IT Dealers Association — Ernakulam District Committee
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2">
              Privacy Policy
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Last updated: November 23, 2026
            </p>
          </div>

          <section className="space-y-2 text-slate-300 text-sm md:text-base leading-relaxed">
            <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
            <p>
              When you register for or log in to the AKITDA Ernakulam Membership Portal or mobile applications
              (AKITDA Ernakulam &amp; AKITDA Admin), we collect business and contact details required to verify
              and administer your association membership:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Business name, company type, GSTIN, and GST Registration Certificate PDF.</li>
              <li>Business address, district, pincode, and AKITDA unit.</li>
              <li>Primary mobile number and email address (used for OTP authentication and membership updates).</li>
              <li>Partner / proprietor names, contact details, and optional passport-size photos.</li>
              <li>Membership fee payment details (UPI UTR / transaction reference numbers and receipt records).</li>
            </ul>
          </section>

          <section className="space-y-2 text-slate-300 text-sm md:text-base leading-relaxed">
            <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To verify GST registration and process committee approval for AKITDA membership.</li>
              <li>To send one-time passwords (OTPs), approval notices, and payment receipts via WhatsApp and Email.</li>
              <li>To issue official Membership IDs, Certificates, and Digital ID Cards.</li>
              <li>To maintain accurate district and unit directories for association administration.</li>
            </ul>
          </section>

          <section className="space-y-2 text-slate-300 text-sm md:text-base leading-relaxed">
            <h2 className="text-xl font-semibold text-white">3. Data Security &amp; Sharing</h2>
            <p>
              We do not sell, rent, or trade your personal or business information to third parties. Authentication
              tokens on mobile devices are stored using Android EncryptedSharedPreferences, and all communication
              between the mobile apps and <span className="text-cyan-400">akitdaekm.com</span> is encrypted over HTTPS.
            </p>
          </section>

          <section className="space-y-2 text-slate-300 text-sm md:text-base leading-relaxed">
            <h2 className="text-xl font-semibold text-white">4. Account &amp; Data Deletion</h2>
            <p>
              Members may request correction or deletion of their membership records by contacting the Ernakulam
              District Committee at{" "}
              <a href="mailto:support@akitdaekm.com" className="text-cyan-400 underline">
                support@akitdaekm.com
              </a>{" "}
              or calling <span className="text-white font-medium">085470 26604</span>.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-800">
            <Link href="/" className="text-cyan-400 hover:underline text-sm font-medium">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
