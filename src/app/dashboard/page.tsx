
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, CreditCard, RefreshCw, CheckCircle, Clock, AlertCircle, Building2, MapPin, Phone, Mail, User, ShieldCheck, AlertTriangle, Headset } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { MembershipCertificate } from "@/components/Certificate";
import { ReceiptDocument } from "@/components/Receipt";
import { TaxInvoice } from "@/components/TaxInvoice";
import { useRouter } from "next/navigation";
import { getFinancialYear } from "@/lib/financial-year";

type Member = {
    id: string;
    memberType: "NEW" | "EXISTING";
    companyName: string;
    companyType: string | null;
    membershipId: string | null;
    status: string;
    primaryEmail: string;
    addressBuilding: string;
    addressArea: string;
    district: string;
    unit: string | null;
    pincode: string;
    primaryMobile: string;
    gstNumber: string | null;
    gstFile: string | null;
    profilePhoto: string | null;
    partners: { id: string; name: string; photoFile: string | null; phone: string | null }[];
    payments: any[];
};

export default function MemberDashboard() {
    const router = useRouter();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [transactionId, setTransactionId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Address Update States
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressForm, setAddressForm] = useState({
        primaryEmail: "",
        addressBuilding: "",
        addressArea: "",
        district: "",
        unit: "",
        pincode: "",
        gstNumber: "",
        companyType: "",
    });
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [updatingAddress, setUpdatingAddress] = useState(false);
    const [submittingProfile, setSubmittingProfile] = useState(false);

    // Profile Completion States
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [partnerForm, setPartnerForm] = useState({ name: "", phone: "", file: null as File | null });
    const [addingPartner, setAddingPartner] = useState(false);

    // Complaint States
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [complaintSubject, setComplaintSubject] = useState("");
    const [complaintMessage, setComplaintMessage] = useState("");
    const [complaintFiles, setComplaintFiles] = useState<File[]>([]);
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    // Upload OTP States
    const [showUploadOtpModal, setShowUploadOtpModal] = useState(false);
    const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
    const [pendingUploadType, setPendingUploadType] = useState<"gst" | "profile" | "partner">("gst");
    const [pendingPartnerId, setPendingPartnerId] = useState<string | null>(null);
    const [uploadOtp, setUploadOtp] = useState("");

    const requestUploadOtp = async (file: File, type: "gst" | "profile" | "partner", partnerId?: string) => {
        setPendingUploadFile(file);
        setPendingUploadType(type);
        setPendingPartnerId(partnerId || null);
        setShowUploadOtpModal(true);
        setUploadOtp("");

        setUploadingDoc(true);
        try {
            const res = await fetch("/api/auth/otp/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: member?.primaryMobile }),
            });
            if (res.ok) {
                alert(`OTP sent to ${member?.primaryMobile}`);
            } else {
                alert("Failed to send OTP");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "gst" | "profile") => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Require OTP for company logo (profile) ALWAYS, and GST for EXISTING members
        if (type === "profile" || (type === "gst" && member?.memberType === "EXISTING")) {
            await requestUploadOtp(file, type);
            e.target.value = "";
            return;
        }

        await executeUpload(file, type);
        e.target.value = "";
    };

    const handlePartnerPhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>, partnerId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Require OTP for partner photo uploads
        await requestUploadOtp(file, "partner", partnerId);
        e.target.value = "";
    };

    const executeUpload = async (file: File, type: "gst" | "profile" | "partner", otp?: string, partnerId?: string) => {
        setUploadingDoc(true);
        const formData = new FormData();

        if (type === "partner") {
            formData.append("action", "update_photo");
            formData.append("partnerId", partnerId!);
            formData.append("file", file);
            if (otp) formData.append("otp", otp);

            try {
                const res = await fetch("/api/members/me/add-partner", { method: "POST", body: formData });
                if (res.ok) {
                    alert("Partner photo updated!");
                    setShowUploadOtpModal(false);
                    setPendingUploadFile(null);
                    fetchMember();
                } else {
                    alert("Upload failed: " + (await res.json()).message);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setUploadingDoc(false);
            }
        } else {
            formData.append("type", type);
            formData.append("file", file);
            if (otp) formData.append("otp", otp);

            try {
                const res = await fetch("/api/members/me/upload-docs", { method: "POST", body: formData });
                if (res.ok) {
                    alert(`${type.toUpperCase()} uploaded successfully!`);
                    setShowUploadOtpModal(false);
                    setPendingUploadFile(null);
                    fetchMember();
                } else {
                    alert("Upload failed: " + (await res.json()).message);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setUploadingDoc(false);
            }
        }
    };

    const handleVerifyAndUpload = () => {
        if (!pendingUploadFile) return;
        if (!uploadOtp) return alert("Please enter OTP");
        executeUpload(pendingUploadFile, pendingUploadType, uploadOtp, pendingPartnerId || undefined);
    };

    const handleAddPartner = async () => {
        if (!partnerForm.name) return alert("Name is required");
        setAddingPartner(true);
        const formData = new FormData();
        formData.append("action", "add");
        formData.append("name", partnerForm.name);
        formData.append("phone", partnerForm.phone);
        if (partnerForm.file) formData.append("file", partnerForm.file);

        try {
            const res = await fetch("/api/members/me/add-partner", { method: "POST", body: formData });
            if (res.ok) {
                alert("Partner added successfully!");
                setShowPartnerModal(false);
                setPartnerForm({ name: "", phone: "", file: null });
                fetchMember();
            } else {
                alert("Failed to add partner.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAddingPartner(false);
        }
    };

    const [signatures, setSignatures] = useState<{
        presidentSignatureUrl?: string;
        secretarySignatureUrl?: string;
        treasurerSignatureUrl?: string;
    }>({});

    useEffect(() => {
        setIsMounted(true);
        fetchMember();
        fetchSignatures();
    }, []);

    async function fetchSignatures() {
        try {
            const res = await fetch("/api/settings/signatures");
            if (res.ok) {
                const data = await res.json();
                setSignatures(data);
            }
        } catch (e) {
            console.error(e);
        }
    }


    async function fetchMember() {
        try {
            const res = await fetch("/api/members/me");
            if (res.status === 401) {
                router.push("/login");
                return;
            }
            const data = await res.json();
            setMember(data.member);
            // Initialize address form
            if (data.member) {
                setAddressForm({
                    primaryEmail: data.member.primaryEmail || "",
                    addressBuilding: data.member.addressBuilding || "",
                    addressArea: data.member.addressArea || "",
                    district: data.member.district || "",
                    unit: data.member.unit || "",
                    pincode: data.member.pincode || "",
                    gstNumber: data.member.gstNumber || "",
                    companyType: data.member.companyType || "",
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function submitPayment(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId }),
            });

            if (res.ok) {
                alert("Payment details submitted! Waiting for admin approval.");
                fetchMember();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to submit payment.");
        } finally {
            setSubmitting(false);
        }
    }

    const handleComplaintSubmit = async () => {
        if (!complaintSubject.trim() || !complaintMessage.trim()) {
            alert("Subject and Message are required.");
            return;
        }

        setSubmittingComplaint(true);
        try {
            const attachmentsArray: { fileName: string; mimeType: string; base64Data: string }[] = [];

            if (complaintFiles.length > 0) {
                // Limit to 10 files
                const filesToProcess = complaintFiles.slice(0, 10);
                for (const file of filesToProcess) {
                    const base64Str = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                    attachmentsArray.push({
                        fileName: file.name,
                        mimeType: file.type,
                        base64Data: base64Str
                    });
                }
            }

            const res = await fetch("/api/members/me/complaint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: complaintSubject,
                    message: complaintMessage,
                    attachments: attachmentsArray
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Complaint registered successfully! The Complaint Cell has been notified.");
                setShowComplaintModal(false);
                setComplaintSubject("");
                setComplaintMessage("");
                setComplaintFiles([]);
            } else {
                alert(data.message || "Failed to register complaint.");
            }
        } catch (error) {
            console.error("Complaint Registration Failed", error);
            alert("An error occurred while submitting your complaint.");
        } finally {
            setSubmittingComplaint(false);
        }
    };

    async function handleSendOtp() {
        if (!member) return;
        setUpdatingAddress(true);
        try {
            const res = await fetch("/api/auth/otp/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: member.primaryMobile }),
            });
            if (res.ok) {
                setOtpSent(true);
                alert(`OTP sent to ${member.primaryMobile}`);
            } else {
                alert("Failed to send OTP");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUpdatingAddress(false);
        }
    }

    async function handleUpdateAddress() {
        if (!otp) {
            alert("Please enter OTP");
            return;
        }
        setUpdatingAddress(true);
        try {
            const res = await fetch("/api/members/me/update-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    otp,
                    ...addressForm
                }),
            });

            if (res.ok) {
                alert("Address updated successfully!");
                setShowAddressModal(false);
                setOtpSent(false);
                setOtp("");
                fetchMember();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update address");
        } finally {
            setUpdatingAddress(false);
        }
    }

    function formatDate(dateString: string | Date) {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-slate-400 font-medium">Loading Dashboard...</p>
            </div>
        </div>
    );

    if (!member) return null;

    return (
        <div className="min-h-screen bg-[#0B1120] font-sans pb-20">
            <Navbar />

            {/* Generic Upload OTP Modal */}
            <Dialog open={showUploadOtpModal} onOpenChange={setShowUploadOtpModal}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Verify Upload</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Please enter the OTP sent to your registered mobile number: <span className="text-slate-200 font-semibold">{member.primaryMobile}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>OTP Code</Label>
                            <Input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={uploadOtp}
                                onChange={(e) => setUploadOtp(e.target.value)}
                                className="bg-slate-800 border-slate-700 tracking-widest text-center text-lg"
                                maxLength={6}
                            />
                        </div>
                        <Button
                            onClick={handleVerifyAndUpload}
                            disabled={uploadingDoc || !uploadOtp}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            {uploadingDoc ? "Uploading..." : "Verify & Upload"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header Section with Gradient */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white pt-10 pb-20 px-4 shadow-lg">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-xl">
                                    {member.profilePhoto ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={member.profilePhoto} alt="Company" className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-10 w-10 text-slate-500" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                                        <span className="text-xs font-semibold text-white">{uploadingDoc ? "..." : "Upload"}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "profile")} disabled={uploadingDoc} />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-bold mb-3 tracking-wide mr-2">
                                    <Building2 className="h-4 w-4 text-blue-300" />
                                    {member.unit ? `${member.unit} Unit Member` : "Member"}
                                </div>
                                {member.companyType && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-sm font-bold mb-3 tracking-wide">
                                        {member.companyType}
                                    </div>
                                )}
                                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{member.companyName}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm">
                                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {member.district}</span>
                                    <span className="hidden md:inline text-slate-600">|</span>
                                    <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-400" /> {member.primaryMobile}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-2">
                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${member.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                member.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                    member.status === 'PROFILE_PENDING' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                                        'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                }`}>
                                {member.status === 'ACTIVE' && <CheckCircle className="h-4 w-4" />}
                                {member.status === 'PAYMENT_PENDING' && <Clock className="h-4 w-4" />}
                                {member.status === 'PROFILE_PENDING' && <AlertCircle className="h-4 w-4" />}
                                {member.status === 'APPROVED' && <AlertCircle className="h-4 w-4" />}
                                {member.status === 'PENDING' && <Clock className="h-4 w-4" />}
                                {member.status}
                            </div>
                            {member.membershipId && (
                                <div className="text-right">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Membership ID</p>
                                    <p className="text-xl font-mono font-bold text-white tracking-wide">{member.membershipId}</p>
                                </div>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        await fetch("/api/members/logout", { method: "POST" });
                                        router.push("/login");
                                    } catch (e) {
                                        console.error("Logout failed", e);
                                    }
                                }}
                                className="mt-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 w-full"
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-4">
                <div className="grid lg:grid-cols-3 gap-4 xl:gap-6">

                    {/* LEFT COLUMN: Profile & Details */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Profile Pending Action Card */}
                        {member.status === "PROFILE_PENDING" && (
                            <Card className="border-purple-600 bg-purple-900/20 shadow-lg border-t-4 border-t-purple-500 overflow-hidden">
                                <CardHeader className="bg-purple-900/30 border-b border-purple-800/50 pb-4">
                                    <CardTitle className="text-purple-300 flex items-center gap-2 text-xl font-bold">
                                        <AlertCircle className="h-6 w-6 text-purple-400" />
                                        Action Required: Complete Your Profile
                                    </CardTitle>
                                    <CardDescription className="text-purple-200/80 leading-relaxed mt-2 text-sm">
                                        Your account was imported by an admin. To proceed with your membership, please verify and update your Business Details, upload your GST Certificate, and add Key Partners (if applicable) below. Once finished, submit your profile for admin approval.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 bg-slate-900/40">
                                    <Button
                                        onClick={async () => {
                                            setSubmittingProfile(true);
                                            try {
                                                const res = await fetch("/api/members/me/submit-approval", { method: "POST" });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    alert("Profile submitted for approval successfully!");
                                                    fetchMember();
                                                } else {
                                                    alert(data.message);
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert("Failed to submit profile.");
                                            } finally {
                                                setSubmittingProfile(false);
                                            }
                                        }}
                                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wide shadow-md shadow-purple-900/50 transition-all border border-purple-500"
                                        disabled={submittingProfile}
                                    >
                                        {submittingProfile ? "Submitting..." : "Submit Profile for Approval"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Company Profile Card */}
                        <Card className="shadow-xl overflow-hidden bg-slate-900/80 backdrop-blur-md border border-slate-700/50">
                            <CardHeader className="bg-white/5 border-b border-blue-400/20 flex flex-row items-center justify-between pb-3 p-4 backdrop-blur-sm">
                                <div>
                                    <CardTitle className="text-lg text-white font-bold tracking-tight">Company Profile</CardTitle>
                                    <CardDescription className="text-blue-200 text-xs">Registered business details and contact info</CardDescription>
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setShowAddressModal(true)} className="gap-2 text-white hover:text-blue-100 hover:bg-white/10 border-blue-400/30 bg-white/5 w-full sm:w-auto h-8 text-xs">
                                        <RefreshCw className="h-3.5 w-3.5" /> Update
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 items-stretch">
                                    {/* Registered Address */}
                                    <div className="flex flex-col">
                                        <Label className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1 block">Registered Address</Label>
                                        <div className="flex-1 text-slate-200 font-medium leading-relaxed bg-slate-800/50 p-3 rounded-md border border-slate-700/50 shadow-inner text-sm flex flex-col justify-center">
                                            <p className="mb-0.5">{member.addressBuilding}</p>
                                            <p className="mb-0.5">{member.addressArea}</p>
                                            <p className="text-slate-400 text-[11px] sm:text-xs mt-1 pt-1 border-t border-slate-700/50">{member.district}, Kerala - {member.pincode}</p>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="flex flex-col">
                                        <Label className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1 block">Contact Information</Label>
                                        <div className="flex-1 space-y-2 flex flex-col justify-center">
                                            <div className="flex items-center gap-3 p-2 bg-slate-800/50 border border-slate-700/50 rounded-md transition-colors hover:bg-slate-800 shadow-inner">
                                                <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                                    <Phone className="h-3.5 w-3.5" />
                                                </div>
                                                <p className="font-medium text-slate-200 text-sm">{member.primaryMobile}</p>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-slate-800/50 border border-slate-700/50 rounded-md transition-colors hover:bg-slate-800 shadow-inner">
                                                <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                                    <Mail className="h-3.5 w-3.5" />
                                                </div>
                                                <p className="font-medium text-slate-200 text-[11px] sm:text-xs md:text-sm break-all">{member.primaryEmail}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GST Number */}
                                    {member.gstNumber && (
                                        <div className="flex flex-col">
                                            <Label className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1 block">GST Number</Label>
                                            <div className="flex-1 flex items-center">
                                                <p className="font-mono text-slate-200 font-bold bg-slate-800/50 px-3 py-2 rounded-md border border-slate-700/50 shadow-inner tracking-wide text-sm w-full">{member.gstNumber}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* GST Certificate */}
                                    <div className="flex flex-col">
                                        <Label className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1 block">GST Certificate</Label>
                                        <div className="flex-1 flex items-center justify-between p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-md shadow-inner">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-xs font-medium text-slate-200">Registration Doc</span>
                                            </div>
                                            <div className="shrink-0 ml-2">
                                                {member.gstFile ? (
                                                    <a href={member.gstFile} target="_blank" rel="noopener noreferrer">
                                                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:text-white h-7 text-xs px-3">View</Button>
                                                    </a>
                                                ) : (
                                                    <Button size="sm" variant="secondary" className="relative h-7 text-[10px] sm:text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-2 sm:px-3">
                                                        <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
                                                            <span>{uploadingDoc ? "..." : "Upload"}</span>
                                                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, "gst")} disabled={uploadingDoc} />
                                                        </label>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>

                        {/* PAYMENT ACTION CARD (for APPROVED status) */}
                        {member.status === "APPROVED" && (
                            <Card className="border-blue-900 bg-[#0f172a] shadow-md border-t-4 border-t-blue-500">
                                <CardHeader>
                                    <CardTitle className="text-blue-400 flex items-center gap-2 text-xl">
                                        <AlertCircle className="h-6 w-6" />
                                        Action Required: Complete Payment
                                    </CardTitle>
                                    <CardDescription className="text-blue-200/80">
                                        Your membership request has been approved. Please pay the required fees to activate your account.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-sm overflow-hidden">
                                        <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                                            {/* FEE BREAKDOWN */}
                                            <div className="md:col-span-3 p-6 space-y-4">
                                                <h3 className="font-semibold text-white mb-2">Membership Fee Structure</h3>
                                                <div className="space-y-3 text-sm">
                                                    {member.memberType === "NEW" && (
                                                        <div className="flex justify-between items-center text-slate-300">
                                                            <span>Admission Fee (One-time)</span>
                                                            <span className="font-mono">₹ 2,000.00</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center text-slate-300">
                                                        <span>Annual Membership Fee</span>
                                                        <span className="font-mono">₹ 1,200.00</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-slate-400">
                                                        <span>GST (18% on Fees)</span>
                                                        <span className="font-mono">₹ {member.memberType === "NEW" ? "576.00" : "216.00"}</span>
                                                    </div>
                                                    <div className="pt-3 mt-3 border-t border-slate-700 flex justify-between items-center font-bold text-lg text-white">
                                                        <span>Total Payable</span>
                                                        <span className="font-mono text-blue-400">₹ {member.memberType === "NEW" ? "3,776.00" : "1,416.00"}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-6 bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
                                                    <p className="text-xs font-bold text-blue-400 uppercase mb-2">Pay via UPI</p>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                        <div>
                                                            <p className="font-mono font-bold text-lg text-white">8547026604@okbizaxis</p>
                                                            <p className="text-xs text-slate-400">AKITDA Official Account</p>
                                                        </div>
                                                        <a
                                                            href={`upi://pay?pa=8547026604@okbizaxis&pn=AKITDA&am=${member.memberType === "NEW" ? "3776.00" : "1416.00"}&cu=INR`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                                        >
                                                            Pay Now
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SUBMIT PROOF */}
                                            <div className="md:col-span-2 p-6 bg-slate-800/50">
                                                <h3 className="font-semibold text-white mb-2">Verify Payment</h3>
                                                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                                    After payment, enter the Transaction ID (UTR / Reference No) below to process your receipt.
                                                </p>
                                                <form onSubmit={submitPayment} className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="tid" className="text-xs font-medium text-slate-400">Transaction ID / UTR</Label>
                                                        <Input
                                                            id="tid"
                                                            placeholder="e.g. 403819XXXXXX"
                                                            value={transactionId}
                                                            onChange={(e) => setTransactionId(e.target.value)}
                                                            required
                                                            className="font-mono text-sm bg-slate-900 border-slate-700 text-white"
                                                        />
                                                    </div>
                                                    <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                                        {submitting ? "Verifying..." : "Submit for Verification"}
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* PENDING VERIFICATION STATE */}
                        {member.status === "PAYMENT_PENDING" && (
                            <Card className="border-yellow-900 bg-[#0f172a] shadow-md border-t-4 border-t-yellow-500">
                                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                                    <div className="h-16 w-16 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-4 animate-pulse">
                                        <Clock className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Verification in Progress</h3>
                                    <p className="text-yellow-200/80 max-w-md">
                                        We have received your payment details. Our admin team will verify the transaction and activate your membership shortly.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* KEY PERSONNEL & SUPPORT GRID */}
                        <div className="grid lg:grid-cols-2 gap-4">
                            {/* KEY PERSONNEL */}
                            <div className="flex flex-col space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">Key Personnel</Label>
                                    {member.companyType !== "Proprietor" && member.companyType !== "Proprietorship" && (
                                        <Button variant="outline" size="sm" onClick={() => setShowPartnerModal(true)} className="h-6 text-[10px] border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 px-2 py-0">
                                            + Add Partner
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {member.partners && member.partners.length > 0 ? (
                                        member.partners.map((partner, idx) => (
                                            <div key={idx} className="flex flex-col bg-[#0f172a]/80 backdrop-blur-sm border border-slate-700/60 rounded-[14px] overflow-hidden hover:border-slate-500 transition-all shadow-md group">
                                                <div className="relative group/photo w-full aspect-[4/3] bg-[#0B1120] flex items-center justify-center">
                                                    {partner.photoFile ? (
                                                        <>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={partner.photoFile} alt={partner.name} className="h-full w-full object-cover object-center" />
                                                        </>
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-600">
                                                            <User className="h-10 w-10 opacity-70" />
                                                        </div>
                                                    )}
                                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity z-10">
                                                        <span className="text-[11px] uppercase font-bold text-white tracking-widest bg-black/40 px-3 py-1.5 rounded-full text-center">Upload Photo</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePartnerPhotoUpdate(e, partner.id)} disabled={uploadingDoc} />
                                                    </label>
                                                </div>
                                                <div className="px-3 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-row items-center justify-between gap-1 overflow-hidden">
                                                    <p className="font-bold text-slate-50 text-[11px] sm:text-xs truncate">{partner.name}</p>
                                                    {partner.phone && <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 truncate shrink-0">{partner.phone}</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 italic col-span-2">No partner details available.</p>
                                    )}
                                </div>
                            </div>

                            {/* SUPPORT & GRIEVANCES CARD */}
                            <div className="flex flex-col justify-end">
                                {/* Invisible spacer to align with Key Personnel label */}
                                <div className="h-[21px] mb-3 hidden lg:block"></div>
                                <Card className="shadow-lg border-indigo-900/50 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] overflow-hidden group h-full flex flex-col justify-center">
                                    <CardHeader className="p-3 border-b border-indigo-500/10 bg-indigo-900/20 flex flex-row items-center gap-3">
                                        <div className="h-8 w-8 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                            <Headset className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold text-indigo-400 tracking-wide">Support & Grievances</CardTitle>
                                            <CardDescription className="text-indigo-200/60 text-[11px] leading-none">District Complaint Cell</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex flex-col items-start gap-4">
                                        <p className="text-xs text-indigo-200/80 leading-relaxed group-hover:text-indigo-100 transition-colors m-0">
                                            Facing an issue with a vendor or unauthorized sales? Submit a formal complaint with proof to the AKITDA District Committee.
                                        </p>
                                        <Button
                                            onClick={() => setShowComplaintModal(true)}
                                            size="sm"
                                            className="w-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500 font-semibold gap-2 transition-all shadow-sm group-hover:shadow-indigo-900/20 whitespace-nowrap"
                                        >
                                            <Headset className="h-3.5 w-3.5" />
                                            Register Complaint
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Documents & Status */}
                    <div className="space-y-4">

                        {/* Status Card */}
                        <Card className="shadow-md border-transparent bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
                            <CardHeader className="pb-2 p-3 border-b border-white/10 bg-white/5">
                                <CardTitle className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Account Status</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-3">
                                <div className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-400 shadow-[0_0_0_4px_rgba(74,222,128,0.2)]' : 'bg-yellow-400'}`}></div>
                                    <span className="font-bold text-lg text-white">{member.status.replace('_', ' ')}</span>
                                </div>
                                <p className="text-sm text-blue-100 mt-2 leading-snug">
                                    {member.status === 'ACTIVE'
                                        ? "Your membership is active and valid for the current financial year."
                                        : "Your account is currently under review or pending action."
                                    }
                                </p>
                            </CardContent>
                            {member.status === 'ACTIVE' && (
                                <CardFooter className="bg-black/10 border-t border-white/10 py-3">
                                    <p className="text-xs text-blue-100 w-full text-center">Valid Until: <span className="font-semibold text-white">31st March, {getFinancialYear().endYear}</span></p>
                                </CardFooter>
                            )}
                        </Card>

                        {/* Documents Section (Only for ACTIVE members) */}
                        {member.status === "ACTIVE" && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest pl-1">Legal Documents</h3>

                                {/* GST Certificate moved to Company Profile section */}

                                <Card className="overflow-hidden hover:border-blue-400 transition-colors group cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-md">
                                    <div className="p-3 flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white text-sm">Membership Certificate</h4>
                                            <p className="text-[10px] text-slate-400 line-clamp-1">Official proof of affiliation</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 px-3 py-2 border-t border-slate-700 group-hover:bg-blue-900/20 transition-colors">
                                        {isMounted && (
                                            <PDFDownloadLink
                                                document={
                                                    <MembershipCertificate
                                                        memberName={member.companyName}
                                                        membershipId={member.membershipId || ""}
                                                        financialYear={getFinancialYear().label}
                                                        presidentSignatureUrl={signatures.presidentSignatureUrl}
                                                        secretarySignatureUrl={signatures.secretarySignatureUrl}
                                                        treasurerSignatureUrl={signatures.treasurerSignatureUrl}
                                                        officialSealUrl={(signatures as any).officialSealUrl}
                                                    />
                                                }
                                                fileName={`AKITDA_Certificate_${member.membershipId}.pdf`}
                                                className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 w-full"
                                            >
                                                {({ loading }) => (
                                                    <>{loading ? "Generating..." : <><Download className="h-3 w-3" /> Download PDF</>}</>
                                                )}
                                            </PDFDownloadLink>
                                        )}
                                    </div>
                                </Card>

                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="overflow-hidden hover:border-green-400 transition-colors group cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-md">
                                        <div className="p-3 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-white text-sm">Tax Invoice</h4>
                                                <p className="text-[10px] text-slate-400 line-clamp-1">GST Invoice for fees paid</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900/50 px-3 py-2 border-t border-slate-700 group-hover:bg-green-900/20 transition-colors">
                                            {member.payments && member.payments.length > 0 && member.payments[0].receiptNumber ? (
                                                isMounted && (
                                                    <PDFDownloadLink
                                                        document={<TaxInvoice
                                                            invoiceNo={member.payments[0].receiptNumber}
                                                            date={formatDate(member.payments[0].createdAt)}
                                                            customerName={member.companyName}
                                                            customerGst={member.gstNumber || ""}
                                                            customerAddress={`${member.addressBuilding}, ${member.addressArea}, ${member.district}`}
                                                            customerPhone={member.primaryMobile}
                                                            items={member.memberType === "NEW" ? [
                                                                { name: "Admission Fee", hsn: "9995", qty: 1, rate: 2000, taxable: false },
                                                                { name: "Membership Fee", hsn: "9995", qty: 1, rate: 1200, taxable: true }
                                                            ] : [
                                                                { name: "Membership Fee", hsn: "9995", qty: 1, rate: 1200, taxable: true }
                                                            ]}
                                                            treasurerSignatureUrl={signatures.treasurerSignatureUrl}
                                                            officialSealUrl={(signatures as any).officialSealUrl}
                                                        />}
                                                        fileName={`AKITDA_Invoice_${member.payments[0].receiptNumber.replace(/\//g, '_')}.pdf`}
                                                        className="text-xs font-medium text-green-400 hover:text-green-300 flex items-center justify-center gap-1.5 w-full"
                                                    >
                                                        {({ loading }) => (
                                                            <>{loading ? "Generating..." : <><Download className="h-3 w-3" /> Download PDF</>}</>
                                                        )}
                                                    </PDFDownloadLink>
                                                )
                                            ) : (
                                                <p className="text-[10px] text-center text-slate-400">Not available yet</p>
                                            )}
                                        </div>
                                    </Card>

                                    <Card className="overflow-hidden hover:border-teal-400 transition-colors group cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-md">
                                        <div className="p-3 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-white text-sm">Payment Receipt</h4>
                                                <p className="text-[10px] text-slate-400 line-clamp-1">Proof of payment transaction</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900/50 px-3 py-2 border-t border-slate-700 group-hover:bg-teal-900/20 transition-colors">
                                            {member.payments && member.payments.length > 0 && member.payments[0].receiptNumber ? (
                                                isMounted && (
                                                    <PDFDownloadLink
                                                        document={<ReceiptDocument
                                                            receiptNumber={member.payments[0].receiptNumber}
                                                            date={formatDate(member.payments[0].createdAt)}
                                                            companyName={member.companyName}
                                                            amount={member.memberType === "NEW" ? 3776 : 1416}
                                                            treasurerSignatureUrl={signatures.treasurerSignatureUrl}
                                                            officialSealUrl={(signatures as any).officialSealUrl}
                                                        />}
                                                        fileName={`AKITDA_Receipt_${member.payments[0].receiptNumber.replace(/\//g, '_')}.pdf`}
                                                        className="text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1.5 w-full"
                                                    >
                                                        {({ loading }) => (
                                                            <Button size="sm" variant="outline" className="gap-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 border-indigo-500/40 bg-indigo-500/10 h-7 text-[10px] px-2" disabled={loading}>
                                                                <>{loading ? "Generating..." : <><Download className="h-3 w-3" /> Download PDF</>}</>
                                                            </Button>
                                                        )}
                                                    </PDFDownloadLink>
                                                )
                                            ) : (
                                                <p className="text-[10px] text-center text-slate-400">Not available yet</p>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ADDRESS UPDATE MODAL */}
            {
                showAddressModal && (
                    <div className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-lg bg-[#1b429b] border-[#1e3a8a] shadow-2xl xl:shadow-blue-900/40">
                            <CardHeader className="border-b border-blue-400/10 pb-4 bg-[#1e3f8f] rounded-t-xl">
                                <CardTitle className="text-xl text-white font-bold tracking-wide">Update Business Details</CardTitle>
                                <CardDescription className="text-blue-100 text-sm mt-1">Verify email & address updates with OTP sent to <span className="text-white font-bold">{member.primaryMobile}</span></CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6 px-6 pb-6">
                                {!otpSent ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                            {/* Row 1 */}
                                            <div className="space-y-1.5 focus-within:relative z-10">
                                                <Label className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">Email Address</Label>
                                                <Input
                                                    type="email"
                                                    value={addressForm.primaryEmail}
                                                    onChange={(e) => setAddressForm({ ...addressForm, primaryEmail: e.target.value })}
                                                    className="bg-[#2e52b6] border-0 text-white placeholder-blue-300 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:bg-[#3258c0] rounded-lg shadow-inner h-10"
                                                />
                                            </div>
                                            <div className="space-y-1.5 focus-within:relative z-10">
                                                <Label className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">GST Number</Label>
                                                <Input
                                                    value={addressForm.gstNumber}
                                                    onChange={(e) => setAddressForm({ ...addressForm, gstNumber: e.target.value })}
                                                    className="bg-[#2e52b6] border-0 text-white placeholder-blue-300 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:bg-[#3258c0] rounded-lg shadow-inner uppercase h-10"
                                                    placeholder="Optional"
                                                />
                                            </div>

                                            {/* Row 2 */}
                                            <div className="space-y-1.5 focus-within:relative z-20">
                                                <Label className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">Company Type</Label>
                                                <Select value={addressForm.companyType} onValueChange={(val) => setAddressForm({ ...addressForm, companyType: val })}>
                                                    <SelectTrigger className="bg-[#2e52b6] border-0 text-white placeholder-blue-300 focus:ring-1 focus:ring-blue-400 rounded-lg shadow-inner h-10">
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#1b429b] border-[#1e3a8a] text-white">
                                                        {["Proprietorship", "Partnership", "LLP", "Private Limited"].map(u => (
                                                            <SelectItem key={u} value={u} className="focus:bg-blue-600 focus:text-white">{u}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div></div> {/* Empty column to match design */}

                                            {/* Row 3 (Full Width) */}
                                            <div className="col-span-2 space-y-1.5 focus-within:relative z-10">
                                                <Label className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">Building Name/No</Label>
                                                <Input
                                                    value={addressForm.addressBuilding}
                                                    onChange={(e) => setAddressForm({ ...addressForm, addressBuilding: e.target.value })}
                                                    className="bg-[#2e52b6] border-0 text-white placeholder-blue-300 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:bg-[#3258c0] rounded-lg shadow-inner h-10"
                                                />
                                            </div>

                                            {/* Row 4 */}
                                            <div className="space-y-1.5 focus-within:relative z-10">
                                                <Label className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">Area / Street</Label>
                                                <Input
                                                    value={addressForm.addressArea}
                                                    onChange={(e) => setAddressForm({ ...addressForm, addressArea: e.target.value })}
                                                    className="bg-[#2e52b6] border-0 text-white placeholder-blue-300 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:bg-[#3258c0] rounded-lg shadow-inner h-10"
                                                />
                                            </div>
                                            <div className="space-y-1.5 focus-within:relative z-10">
                                                <Label className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">Pincode</Label>
                                                <Input
                                                    value={addressForm.pincode}
                                                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                                    className="bg-[#2e52b6] border-0 text-white placeholder-blue-300 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:bg-[#3258c0] rounded-lg shadow-inner h-10"
                                                />
                                            </div>

                                            {/* Row 5 */}
                                            <div className="space-y-1.5 focus-within:relative z-10">
                                                <Label className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">District</Label>
                                                <Input
                                                    value={addressForm.district}
                                                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                                                    className="bg-[#2e52b6] border-0 text-white placeholder-blue-300 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:bg-[#3258c0] rounded-lg shadow-inner h-10"
                                                />
                                            </div>
                                            <div className="space-y-1.5 focus-within:relative z-20">
                                                <Label className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">Unit</Label>
                                                <Select value={addressForm.unit} onValueChange={(val) => setAddressForm({ ...addressForm, unit: val })}>
                                                    <SelectTrigger className="bg-[#2e52b6] border-0 text-blue-300 placeholder-blue-300 focus:ring-1 focus:ring-blue-400 rounded-lg shadow-inner h-10 data-[state=open]:text-white data-[state=closed]:data-[placeholder]:text-blue-300">
                                                        <SelectValue placeholder="Select Unit" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#1b429b] border-[#1e3a8a] text-white">
                                                        {["Aluva", "Perumbavoor", "Paravoor", "Kothamangalam", "Angamaly", "Vypin", "Edappally", "Kacheripady", "Panambilly Nagar"].map(u => (
                                                            <SelectItem key={u} value={u} className="focus:bg-blue-600 focus:text-white">{u}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button onClick={handleSendOtp} className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold h-10 sm:h-11 rounded-lg transition-colors" disabled={updatingAddress}>
                                                {updatingAddress ? "Sending OTP..." : "Get OTP to Update"}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-[#2e52b6] p-4 rounded-lg text-sm text-blue-100 flex items-center gap-3 shadow-inner">
                                            <div className="bg-[#3b82f6] p-1 rounded-full"><CheckCircle className="h-4 w-4 text-white" /></div>
                                            <div>OTP sent to <strong>{member.primaryMobile}</strong>.</div>
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            <Label className="text-blue-200 text-xs uppercase tracking-wider font-semibold">Enter 6-Digit OTP</Label>
                                            <Input
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                placeholder="• • • • • •"
                                                maxLength={6}
                                                className="bg-[#1e3a8a] border-blue-400 text-white text-center text-2xl tracking-widest font-mono h-14"
                                            />
                                        </div>
                                        <Button onClick={handleUpdateAddress} className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold h-12 mt-2 shadow-lg transition-all text-md" disabled={updatingAddress}>
                                            {updatingAddress ? "Updating..." : "Verify & Save Address"}
                                        </Button>
                                    </div>
                                )}

                                <div className="text-center mt-3">
                                    <Button variant="ghost" onClick={() => setShowAddressModal(false)} className="text-blue-200 hover:text-white hover:bg-transparent font-medium h-auto p-2">
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* ADD PARTNER MODAL */}
            {
                showPartnerModal && (
                    <div className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-lg bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] border-blue-900 shadow-2xl xl:shadow-blue-900/20 shadow-[0_0_50px_-12px_rgba(29,78,216,0.3)]">
                            <CardHeader className="border-b border-blue-400/20 pb-4 bg-white/5">
                                <CardTitle className="text-xl text-white font-bold tracking-wide">Add New Partner</CardTitle>
                                <CardDescription className="text-blue-200">Register key personnel for your company</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-blue-300 text-xs uppercase tracking-wider font-semibold">Partner Full Name</Label>
                                    <Input
                                        value={partnerForm.name}
                                        onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                                        className="bg-white/10 border-blue-400/20 text-white placeholder-blue-300/50"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-blue-300 text-xs uppercase tracking-wider font-semibold">Contact Number</Label>
                                    <Input
                                        value={partnerForm.phone}
                                        onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                                        className="bg-white/10 border-blue-400/20 text-white placeholder-blue-300/50"
                                        placeholder="9876543210"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-blue-300 text-xs uppercase tracking-wider font-semibold">Photo (Optional)</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files) setPartnerForm({ ...partnerForm, file: e.target.files[0] });
                                        }}
                                        className="bg-white/10 border-blue-400/20 text-slate-300 cursor-pointer"
                                    />
                                </div>
                                <Button onClick={handleAddPartner} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold mt-4" disabled={addingPartner}>
                                    {addingPartner ? "Adding..." : "Add Partner"}
                                </Button>
                                <Button variant="ghost" onClick={() => setShowPartnerModal(false)} className="w-full mt-2 text-blue-200 hover:text-white hover:bg-white/10 font-medium">
                                    Cancel
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* COMPLAINT REGISTRATION MODAL */}
            <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
                <DialogContent className="sm:max-w-md bg-[#0f172a] text-white border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            Register a Complaint
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Your complaint will be sent directly to the District Complaint Cell (complaintcellekm@akitda.co.in & gsekm@akitda.co.in).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">From (Email)</Label>
                            <Input
                                type="email"
                                value={member?.primaryEmail || ""}
                                disabled
                                className="bg-slate-800/50 border-slate-700 text-slate-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Subject <span className="text-red-400">*</span></Label>
                            <Input
                                placeholder="Brief summary of your complaint"
                                value={complaintSubject}
                                onChange={(e) => setComplaintSubject(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Message <span className="text-red-400">*</span></Label>
                            <textarea
                                placeholder="Describe your issue in detail..."
                                value={complaintMessage}
                                onChange={(e) => setComplaintMessage(e.target.value)}
                                rows={4}
                                className="w-full bg-slate-800 border-slate-700 text-white placeholder-slate-500 p-3 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Proof/Attachments (Max 10)</Label>
                            <Input
                                type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const selectedFiles = Array.from(e.target.files);
                                        if (selectedFiles.length > 10) {
                                            alert("You can only attach a maximum of 10 files.");
                                            setComplaintFiles(selectedFiles.slice(0, 10));
                                        } else {
                                            setComplaintFiles(selectedFiles);
                                        }
                                    }
                                }}
                                className="bg-slate-800/50 border-slate-700 text-slate-400 cursor-pointer"
                            />
                            {complaintFiles.length > 0 && (
                                <p className="text-xs text-blue-400">{complaintFiles.length} file(s) attached.</p>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowComplaintModal(false)}
                                className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleComplaintSubmit}
                                disabled={submittingComplaint}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                                {submittingComplaint ? "Sending..." : "Submit Complaint"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div >
    );
}
