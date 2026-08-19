"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Check, X, Pencil, Trash2, Plus, Upload, Save, Download, Upload as UploadIcon, Lock } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { MemberIDCardDocument } from "@/components/IDCard";
import { MembershipCertificate } from "@/components/Certificate";
import { getFinancialYear } from "@/lib/financial-year";

// --- Types ---

type Member = {
    id: string;
    companyName: string;
    companyType: string;
    memberType: "NEW" | "EXISTING";
    membershipId: string | null;
    primaryMobile: string;
    primaryEmail: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "PAYMENT_PENDING" | "ACTIVE" | "PROFILE_PENDING";
    gstNumber: string;
    gstFile: string;
    photoFile: string;
    joinedAt: string;
    addressBuilding: string;
    addressArea: string;
    district: string | null;
    unit?: string | null;
    approvalPresident?: boolean;
    approvalSecretary?: boolean;
    approvalTreasurer?: boolean;
    partners?: { name: string; phone?: string; email?: string }[];
    pincode?: string;
};

type OfficeBearer = {
    id: string;
    name: string;
    position: string;
    level: string;
    district?: string;
    phone?: string;
    photoUrl?: string;
    order: number;
};

type GalleryItem = {
    id: string;
    title: string | null;
    type: "PHOTO" | "VIDEO";
    url: string;
    description: string | null;
    createdAt: string;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [officeBearers, setOfficeBearers] = useState<OfficeBearer[]>([]);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentAdmin, setCurrentAdmin] = useState<{ id: string, email: string, role: string } | null>(null);

    // Dialog States for Office Bearers
    const [isOBDialogOpen, setIsOBDialogOpen] = useState(false);
    const [editingBearer, setEditingBearer] = useState<OfficeBearer | null>(null);

    // Settings
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [changingPassword, setChangingPassword] = useState(false);
    const [importing, setImporting] = useState(false);

    // Signatures & Seal
    const [signatures, setSignatures] = useState<{
        presidentSignatureUrl: string | null;
        secretarySignatureUrl: string | null;
        treasurerSignatureUrl: string | null;
        officialSealUrl: string | null;
    }>({
        presidentSignatureUrl: null,
        secretarySignatureUrl: null,
        treasurerSignatureUrl: null,
        officialSealUrl: null,
    });
    const [uploadingSignature, setUploadingSignature] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchAdminAndData();
    }, []);

    async function fetchAdminAndData() {
        try {
            // Fetch Current Admin
            const adminRes = await fetch("/api/admin/me");
            if (adminRes.status === 401) {
                router.push("/admin/login");
                return;
            }
            const adminData = await adminRes.json();
            setCurrentAdmin(adminData);

            // Fetch Members
            fetchMembers();

            // Fetch Office Bearers
            fetchOfficeBearers();
            fetchGalleryItems();
            fetchSignatures();
        } catch (e) {
            console.error("Error fetching data:", e);
        } finally {
            setLoading(false);
        }
    }

    async function fetchSignatures() {
        try {
            const res = await fetch("/api/admin/signatures");
            if (res.ok) {
                const data = await res.json();
                setSignatures(data);
            }
        } catch (e) {
            console.error("Error fetching signatures:", e);
        }
    }

    async function handleSignatureUpload(role: "president" | "secretary" | "treasurer" | "seal", file: File) {
        if (!file) return;
        setUploadingSignature(role);
        const formData = new FormData();
        formData.append("role", role);
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/signatures", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                alert(`${role.toUpperCase()} uploaded successfully!`);
                fetchSignatures();
            } else {
                alert(data.message || "Failed to upload file");
            }
        } catch (e) {
            console.error(e);
            alert("Upload error");
        } finally {
            setUploadingSignature(null);
        }
    }



    async function fetchMembers() {
        try {
            const res = await fetch("/api/admin/members");
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchOfficeBearers() {
        try {
            const res = await fetch("/api/admin/office-bearers");
            if (res.ok) {
                const data = await res.json();
                setOfficeBearers(data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchGalleryItems() {
        try {
            const res = await fetch("/api/admin/gallery");
            if (res.ok) {
                const data = await res.json();
                setGalleryItems(data.items);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        setChangingPassword(true);
        try {
            const res = await fetch("/api/admin/reset-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Password updated successfully");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                alert(data.message || "Failed to update password");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred");
        } finally {
            setChangingPassword(false);
        }
    }

    async function handleDataReset() {
        if (!confirm("DANGER: Are you absolutely sure you want to wipe ALL membership data? This cannot be undone.")) return;

        const verification = prompt("Type 'DELETE' to confirm data wipe:");
        if (verification !== "DELETE") {
            alert("Data wipe cancelled.");
            return;
        }

        try {
            const res = await fetch("/api/admin/system/reset", {
                method: "POST",
            });
            if (res.ok) {
                alert("All membership data has been wiped successfully.");
                fetchMembers();
            } else {
                alert((await res.json()).message);
            }
        } catch (e) {
            console.error("Error wiping data:", e);
            alert("Failed to wipe data.");
        }
    }

    async function handleBackup() {
        try {
            const res = await fetch("/api/admin/system/backup");
            if (!res.ok) throw new Error("Backup failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `akitda_backup_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            alert("Failed to download backup.");
        }
    }

    async function handleRestore(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const file = formData.get("backupFile") as File;

        if (!file) return alert("Please select a ZIP file.");
        if (!confirm("WARNING: Restoring will overwrite the current database and all uploads. This action cannot be undone. Proceed?")) return;

        try {
            const res = await fetch("/api/admin/system/restore", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                alert("System restored successfully. Please refresh the page.");
                window.location.reload();
            } else {
                alert((await res.json()).message || "Restore failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during restore.");
        }
    }

    // --- Member Actions ---

    async function updateStatus(id: string, status: "APPROVED" | "REJECTED") {
        try {
            const res = await fetch(`/api/admin/members/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                fetchMembers();
            } else {
                alert((await res.json()).message);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function updateApproval(id: string, field: string, value: boolean) {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
        try {
            const res = await fetch(`/api/admin/members/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value }),
            });
            if (!res.ok) {
                alert((await res.json()).message);
                fetchMembers();
            }
        } catch (e) {
            console.error(e);
            fetchMembers();
        }
    }

    async function deleteMember(id: string) {
        if (!confirm("Are you sure you want to delete this member?")) return;
        try {
            const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
            if (res.ok) fetchMembers();
            else alert("Failed to delete member.");
        } catch (e) {
            console.error(e);
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];

                const membersToImport = data.map((row) => ({
                    companyName: row["Company Name"] || row["Company"] || row["company_name"] || row["companyName"] || "",
                    memberName: row["Member Name"] || row["Partner"] || row["Name"] || row["memberName"] || row["Partners / Proprietors"] || "",
                    mobile: row["Primary Mobile"] || row["Mobile"] || row["Phone"] || row["mobile"] || ""
                })).filter(m => m.companyName && m.mobile);

                if (membersToImport.length === 0) {
                    alert("No valid rows found. Ensure Excel has columns like 'Company Name' and 'Primary Mobile'.");
                    setImporting(false);
                    return;
                }

                const res = await fetch("/api/admin/members/bulk-import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(membersToImport)
                });

                if (res.ok) {
                    const result = await res.json();
                    alert(result.message || "Import successful!");
                    fetchMembers();
                } else {
                    alert("Import failed: " + (await res.json()).message);
                }
            } catch (e) {
                console.error(e);
                alert("An error occurred during import. Check the file format.");
            } finally {
                setImporting(false);
                e.target.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadExcel = () => {
        const data = members.map(member => {
            const firstPartnerName = member.partners && member.partners.length > 0 ? member.partners[0].name : "N/A";

            return {
                "Membership ID": member.membershipId || "N/A",
                "Company Name": member.companyName,
                "Company Type": member.companyType,
                "Building Name": member.addressBuilding,
                "Local Area": member.addressArea,
                "District": member.district,
                "Unit": member.unit || "N/A",
                "Pincode": member.pincode,
                "Partners / Proprietors": firstPartnerName,
                "Phone": member.primaryMobile,
                "Email": member.primaryEmail,
                "GST Number": member.gstNumber,
                "Status": member.status,
                "Joined At": new Date(member.joinedAt).toLocaleDateString(),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
        XLSX.writeFile(workbook, "akitda_members.xlsx");
    };

    // --- Gallery Actions ---

    async function handleAddGalleryItem(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            const res = await fetch("/api/admin/gallery", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                fetchGalleryItems();
                alert("Gallery item added!");
            } else {
                alert((await res.json()).message);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function handleDeleteGalleryItem(id: string) {
        if (!confirm("Delete this gallery item?")) return;
        try {
            const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
            if (res.ok) fetchGalleryItems();
            else alert("Failed to delete");
        } catch (e) {
            console.error(e);
        }
    }

    // --- Office Bearer Actions ---

    async function handleBearerSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // If editing, use PUT to [id], else POST to root
        const url = editingBearer
            ? `/api/admin/office-bearers/${editingBearer.id}`
            : "/api/admin/office-bearers";

        const method = editingBearer ? "PUT" : "POST";

        // Append 'edit' ID if needed, though usually in URL for PUT
        // Clean up formData if file is empty string (though browser handles this usually)

        try {
            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                fetchOfficeBearers();
                setIsOBDialogOpen(false);
                setEditingBearer(null);
            } else {
                alert("Failed to save office bearer.");
            }
        } catch (e) {
            console.error("Error saving office bearer:", e);
        }
    }

    async function deleteBearer(id: string) {
        if (!confirm("Are you sure you want to delete this office bearer?")) return;
        try {
            const res = await fetch(`/api/admin/office-bearers/${id}`, { method: "DELETE" });
            if (res.ok) fetchOfficeBearers();
            else alert("Failed to delete.");
        } catch (e) {
            console.error(e);
        }
    }

    const canApprove = (role: string | undefined, type: "PRESIDENT" | "SECRETARY" | "TREASURER") => {
        if (!role) return false;
        if (role === "SUPER_ADMIN") return true;
        return role === type;
    };

    const filteredMembers = members.filter(m =>
        m.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.primaryMobile?.includes(searchQuery) ||
        m.membershipId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.primaryEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
            {/* Professional Admin Header */}
            <header className="bg-slate-900 border-b border-slate-800 text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">A</div>
                        <h1 className="text-xl font-bold tracking-tight">AKITDA Admin</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        {currentAdmin && (
                            <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm font-medium text-slate-300">
                                    {currentAdmin.role.replace(/_/g, " ")}
                                </span>
                            </div>
                        )}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                                    <Lock className="mr-2 h-4 w-4" /> Change Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
                                <DialogHeader>
                                    <DialogTitle className="text-white flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-slate-400" /> Change Password
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Current Password</Label>
                                        <Input
                                            type="password"
                                            required
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Password</Label>
                                        <Input
                                            type="password"
                                            required
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirm New Password</Label>
                                        <Input
                                            type="password"
                                            required
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-blue-500"
                                        />
                                    </div>
                                    <Button type="submit" disabled={changingPassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg mt-2">
                                        {changingPassword ? "Updating Password..." : "Update Password"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                            onClick={async () => {
                                await fetch("/api/admin/logout", { method: "POST" });
                                router.push("/admin/login");
                            }}
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h2>
                    <p className="text-slate-400 mt-1">Manage members, office bearers, and gallery content.</p>
                </div>

                <Tabs defaultValue="members" className="space-y-8">
                    <div className="bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-800 inline-flex">
                        <TabsList className="h-auto p-0 bg-transparent flex gap-1">
                            <TabsTrigger
                                value="members"
                                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400 data-[state=active]:shadow-none font-medium text-slate-400 hover:text-slate-200"
                            >
                                Members
                            </TabsTrigger>
                            {currentAdmin?.role === "SUPER_ADMIN" && (
                                <TabsTrigger
                                    value="office-bearers"
                                    className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400 data-[state=active]:shadow-none font-medium text-slate-400 hover:text-slate-200"
                                >
                                    Office Bearers
                                </TabsTrigger>
                            )}
                            {currentAdmin?.role === "SUPER_ADMIN" && (
                                <TabsTrigger
                                    value="gallery"
                                    className="px-6 py-2.5 rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400 data-[state=active]:shadow-none font-medium text-slate-400 hover:text-slate-200"
                                >
                                    Gallery
                                </TabsTrigger>
                            )}
                            {currentAdmin?.role === "SUPER_ADMIN" && (
                                <TabsTrigger
                                    value="settings"
                                    className="px-6 py-2.5 rounded-lg data-[state=active]:bg-red-900/50 data-[state=active]:text-red-400 data-[state=active]:shadow-lg font-medium text-red-500/70 hover:text-red-400"
                                >
                                    Settings & Data
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    {/* --- MEMBERS TAB --- */}
                    <TabsContent value="members" className="space-y-4">
                        <div className="flex justify-end gap-3">
                            <div>
                                <input type="file" id="excel-upload" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
                                <Button asChild className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white shadow-md">
                                    <label htmlFor="excel-upload">{importing ? "Importing..." : "Bulk Import (Excel)"}</label>
                                </Button>
                            </div>
                            <Button onClick={downloadExcel} className="bg-green-600 hover:bg-green-700 shadow-md">
                                Export to Excel
                            </Button>
                        </div>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <CardTitle className="text-white">Member Applications</CardTitle>
                                <Input
                                    placeholder="Search company, phone, ID, status..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="max-w-xs bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
                                />
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-800/50">
                                        <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                            <TableHead className="text-slate-300">Company</TableHead>
                                            <TableHead className="text-slate-300">Type</TableHead>
                                            <TableHead className="text-slate-300">Contact / Address</TableHead>
                                            <TableHead className="text-slate-300">Status</TableHead>
                                            <TableHead className="text-slate-300">Files</TableHead>
                                            <TableHead className="text-slate-300">Committee (P/S/T)</TableHead>
                                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMembers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-slate-500 py-8">No members found matching your search.</TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredMembers.map((member) => (
                                                <TableRow key={member.id} className="border-slate-800 hover:bg-slate-800/40">
                                                    <TableCell className="font-medium text-slate-200">{member.companyName}</TableCell>
                                                    <TableCell className="text-slate-300">{member.companyType}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-slate-200">{member.primaryMobile}</div>
                                                        <div className="text-sm text-slate-400">{member.primaryEmail}</div>
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            {member.addressBuilding}, {member.addressArea}<br />
                                                            {member.district}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={(member.status === "PENDING" || member.status === "PROFILE_PENDING") ? "outline" : member.status === "APPROVED" ? "default" : "destructive"}>
                                                            {member.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                         <div className="flex gap-2 mb-2">
                                                             {member.gstFile && (
                                                                 <a href={member.gstFile} target="_blank" rel="noopener noreferrer">
                                                                     <Button size="sm" variant="ghost" className="h-6 px-2">GST</Button>
                                                                 </a>
                                                             )}
                                                             {member.photoFile && (
                                                                 <a href={member.photoFile} target="_blank" rel="noopener noreferrer">
                                                                     <Button size="sm" variant="ghost" className="h-6 px-2">Photo</Button>
                                                                 </a>
                                                             )}
                                                         </div>
                                                         {member.status === "ACTIVE" && isMounted && (
                                                             <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-slate-800">
                                                                 <PDFDownloadLink
                                                                     document={
                                                                         <MemberIDCardDocument
                                                                             companyName={member.companyName}
                                                                             proprietorName={member.partners?.[0]?.name}
                                                                             membershipId={member.membershipId || ""}
                                                                             primaryMobile={member.primaryMobile}
                                                                             primaryEmail={member.primaryEmail}
                                                                             district={member.district || "Ernakulam"}
                                                                             unit={member.unit || undefined}
                                                                             profilePhoto={member.photoFile}
                                                                             financialYear={getFinancialYear().label}
                                                                             presidentSignatureUrl={signatures.presidentSignatureUrl}
                                                                             secretarySignatureUrl={signatures.secretarySignatureUrl}
                                                                             officialSealUrl={signatures.officialSealUrl}
                                                                         />
                                                                     }
                                                                     fileName={`AKITDA_ID_Card_${member.membershipId}.pdf`}
                                                                     className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                                                                 >
                                                                     {({ loading }) => (loading ? "..." : "🪪 ID Card")}
                                                                 </PDFDownloadLink>
                                                                 <PDFDownloadLink
                                                                     document={
                                                                         <MembershipCertificate
                                                                             memberName={member.companyName}
                                                                             membershipId={member.membershipId || ""}
                                                                             financialYear={getFinancialYear().label}
                                                                             presidentSignatureUrl={signatures.presidentSignatureUrl || undefined}
                                                                             secretarySignatureUrl={signatures.secretarySignatureUrl || undefined}
                                                                             treasurerSignatureUrl={signatures.treasurerSignatureUrl || undefined}
                                                                             officialSealUrl={signatures.officialSealUrl || undefined}
                                                                         />
                                                                     }
                                                                     fileName={`AKITDA_Certificate_${member.membershipId}.pdf`}
                                                                     className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                                                                 >
                                                                     {({ loading }) => (loading ? "..." : "📜 Certificate")}
                                                                 </PDFDownloadLink>
                                                             </div>
                                                         )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-4 items-center">
                                                            <label className="flex items-center gap-1 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={member.approvalPresident || false}
                                                                    onChange={(e) => updateApproval(member.id, "approvalPresident", e.target.checked)}
                                                                    disabled={!canApprove(currentAdmin?.role, "PRESIDENT")}
                                                                    className="w-4 h-4"
                                                                /> P
                                                            </label>
                                                            <label className="flex items-center gap-1 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={member.approvalSecretary || false}
                                                                    onChange={(e) => updateApproval(member.id, "approvalSecretary", e.target.checked)}
                                                                    disabled={!canApprove(currentAdmin?.role, "SECRETARY")}
                                                                    className="w-4 h-4"
                                                                /> S
                                                            </label>
                                                            <label className="flex items-center gap-1 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={member.approvalTreasurer || false}
                                                                    onChange={(e) => updateApproval(member.id, "approvalTreasurer", e.target.checked)}
                                                                    disabled={!canApprove(currentAdmin?.role, "TREASURER")}
                                                                    className="w-4 h-4"
                                                                /> T
                                                            </label>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-2 min-w-[140px] items-end">
                                                            {/* Verify Payment Logic */}
                                                            {member.status === "PAYMENT_PENDING" && (
                                                                <div className="flex flex-col gap-2 w-full">
                                                                    <div className="text-xs text-blue-400 font-mono bg-blue-900/30 p-1.5 rounded text-center border border-blue-800/50">
                                                                        Pending Verification
                                                                    </div>
                                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white w-full shadow" onClick={async () => {
                                                                        if (!confirm("Confirm payment received?")) return;
                                                                        const res = await fetch(`/api/admin/members/${member.id}/verify-payment`, { method: "PUT" });
                                                                        if (res.ok) fetchMembers();
                                                                        else alert((await res.json()).message);
                                                                    }}>
                                                                        <Check className="w-4 h-4 mr-1" /> Verify Payment
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {(member.status === "PROFILE_PENDING" || member.status === "PENDING" || member.status === "APPROVED") && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const role = currentAdmin?.role;
                                                                        let myRoleField = "";
                                                                        if (role === "PRESIDENT") myRoleField = "approvalPresident";
                                                                        else if (role === "SECRETARY") myRoleField = "approvalSecretary";
                                                                        else if (role === "TREASURER") myRoleField = "approvalTreasurer";

                                                                        if (myRoleField && !member[myRoleField as keyof Member]) {
                                                                            updateApproval(member.id, myRoleField, true);
                                                                        } else {
                                                                            // If already voted, or super admin, try to finalize
                                                                            fetch(`/api/admin/members/${member.id}/status`, {
                                                                                method: "PUT",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({ status: "APPROVED" }),
                                                                            }).then(res => { if (res.ok) fetchMembers(); else alert("Need more approvals"); });
                                                                        }
                                                                    }}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full shadow"
                                                                >
                                                                    <Check className="w-4 h-4 mr-1" /> Vote / Approve
                                                                </Button>
                                                            )}

                                                            {member.status !== "REJECTED" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-red-900/50 bg-red-950/20 text-red-500 hover:bg-red-900 hover:text-white w-full"
                                                                    onClick={async () => {
                                                                        if (!confirm("Are you sure you want to reject this application?")) return;
                                                                        try {
                                                                            const res = await fetch(`/api/admin/members/${member.id}/status`, {
                                                                                method: "PUT",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({ status: "REJECTED" }),
                                                                            });
                                                                            if (res.ok) fetchMembers();
                                                                        } catch (e) {
                                                                            console.error(e);
                                                                        }
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                                </Button>
                                                            )}

                                                            {currentAdmin?.role === "SUPER_ADMIN" && (
                                                                <Button size="sm" variant="ghost" className="text-slate-400 hover:bg-slate-800 hover:text-red-400 w-full" onClick={() => deleteMember(member.id)}>
                                                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- OFFICE BEARERS TAB --- */}
                    <TabsContent value="office-bearers" className="space-y-4">
                        {/* ... (Office Bearers Content) */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-200">Committee Management</h2>
                            <Dialog open={isOBDialogOpen} onOpenChange={setIsOBDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Plus className="mr-2 h-4 w-4" /> Add Office Bearer
                                    </Button>
                                </DialogTrigger>
                                <DialogContent key={editingBearer ? editingBearer.id : "new"} className="bg-slate-900 border-slate-800 text-slate-200">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">{editingBearer ? "Edit Office Bearer" : "Add New Office Bearer"}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleBearerSubmit} className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" name="name" defaultValue={editingBearer?.name} required placeholder="Full Name" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="position">Position / Designation</Label>
                                            <Input id="position" name="position" defaultValue={editingBearer?.position} required placeholder="e.g. President, Secretary" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="level">Level</Label>
                                                <Select name="level" defaultValue={editingBearer?.level || "DISTRICT"}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Level" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="DISTRICT">District</SelectItem>
                                                        <SelectItem value="STATE">State</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="district">District (if applicable)</Label>
                                                <Select name="district" defaultValue={editingBearer?.district || "Ernakulam"}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select District" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Ernakulam">Ernakulam</SelectItem>
                                                        <SelectItem value="Trivandrum">Trivandrum</SelectItem>
                                                        <SelectItem value="Kozhikode">Kozhikode</SelectItem>
                                                        {/* Add more as needed */}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone (Optional)</Label>
                                            <Input id="phone" name="phone" defaultValue={editingBearer?.phone} placeholder="+91..." />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="order">Sort Order (1 = Top)</Label>
                                            <Input id="order" name="order" type="number" defaultValue={editingBearer?.order || 0} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="photoFile">Photo</Label>
                                            <Input id="photoFile" name="photoFile" type="file" accept="image/*" />
                                            {editingBearer?.photoUrl && <p className="text-xs text-slate-400">Current: {editingBearer.photoUrl.split('/').pop()}</p>}
                                        </div>
                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                            {editingBearer ? "Update Details" : "Create Office Bearer"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Tabs defaultValue="state" className="w-full">
                            <div className="flex mb-6">
                                <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl">
                                    <TabsTrigger value="district" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-400">
                                        District Committee
                                    </TabsTrigger>
                                    <TabsTrigger value="state" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-400">
                                        State Committee
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <TabsContent value="district">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {officeBearers.filter(b => b.level === "DISTRICT").map((bearer) => (
                                        <Card key={bearer.id} className="overflow-hidden bg-slate-900 border-slate-800">
                                            <div className="flex justify-center pt-6 pb-2">
                                                <div className="aspect-square w-1/2 bg-slate-800 relative rounded-md overflow-hidden border border-slate-700">
                                                    {bearer.photoUrl ? (
                                                        <img src={bearer.photoUrl} alt={bearer.name} className="object-cover object-top w-full h-full" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-slate-600">
                                                            <Upload className="h-8 w-8 opacity-50" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-200">{bearer.name}</h3>
                                                        <p className="text-blue-400 font-medium">{bearer.position}</p>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">{bearer.district || "District"}</Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 mb-4">Order: {bearer.order}</p>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="flex-1 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => {
                                                        setEditingBearer(bearer);
                                                        setIsOBDialogOpen(true);
                                                    }}>
                                                        <Pencil className="h-4 w-4 mr-1" /> Edit
                                                    </Button>
                                                    <Button variant="destructive" size="sm" className="flex-1 bg-red-900/50 text-red-500 hover:bg-red-800 hover:text-white" onClick={() => deleteBearer(bearer.id)}>
                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {officeBearers.filter(b => b.level === "DISTRICT").length === 0 && (
                                        <div className="col-span-full text-center py-12 text-slate-500 border-2 border-slate-800 border-dashed rounded-xl">
                                            No district office bearers found. Click &quot;Add Office Bearer&quot; to start.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="state">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {officeBearers.filter(b => b.level === "STATE").map((bearer) => (
                                        <Card key={bearer.id} className="overflow-hidden bg-slate-900 border-slate-800">
                                            <div className="flex justify-center pt-6 pb-2">
                                                <div className="aspect-square w-1/2 bg-slate-800 relative rounded-md overflow-hidden border border-slate-700">
                                                    {bearer.photoUrl ? (
                                                        <img src={bearer.photoUrl} alt={bearer.name} className="object-cover object-top w-full h-full" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-slate-600">
                                                            <Upload className="h-8 w-8 opacity-50" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-200">{bearer.name}</h3>
                                                        <p className="text-blue-400 font-medium">{bearer.position}</p>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">STATE</Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 mb-4">Order: {bearer.order}</p>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="flex-1 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => {
                                                        setEditingBearer(bearer);
                                                        setIsOBDialogOpen(true);
                                                    }}>
                                                        <Pencil className="h-4 w-4 mr-1" /> Edit
                                                    </Button>
                                                    <Button variant="destructive" size="sm" className="flex-1 bg-red-900/50 text-red-500 hover:bg-red-800 hover:text-white" onClick={() => deleteBearer(bearer.id)}>
                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {officeBearers.filter(b => b.level === "STATE").length === 0 && (
                                        <div className="col-span-full text-center py-12 text-slate-500 border-2 border-slate-800 border-dashed rounded-xl">
                                            No state office bearers found. Click &quot;Add Office Bearer&quot; to start.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    {/* --- GALLERY TAB --- */}
                    <TabsContent value="gallery" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-200">Gallery Management</h2>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Add Gallery Item</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddGalleryItem} className="space-y-4">
                                        <div>
                                            <Label>Title</Label>
                                            <Input name="title" required placeholder="Event Title" />
                                        </div>
                                        <div>
                                            <Label>Type</Label>
                                            <Select name="type" defaultValue="PHOTO">
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PHOTO">Photo</SelectItem>
                                                    <SelectItem value="VIDEO">Video</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Description</Label>
                                            <Input name="description" placeholder="Optional description" />
                                        </div>
                                        <div>
                                            <Label>Photo File (if Photo)</Label>
                                            <Input name="photoFile" type="file" accept="image/*" />
                                        </div>
                                        <div>
                                            <Label>Video URL (for YouTube)</Label>
                                            <Input name="videoUrl" placeholder="https://youtube.com/..." />
                                        </div>
                                        <Button type="submit" className="w-full">Save Item</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {galleryItems.map((item) => (
                                <Card key={item.id} className="overflow-hidden bg-slate-900 border-slate-800">
                                    <div className="aspect-video bg-slate-800 relative group">
                                        {item.type === "PHOTO" ? (
                                            <img src={item.url} alt={item.title || "Gallery"} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-slate-950 text-white">
                                                Video: {item.title}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDeleteGalleryItem(item.id)}
                                            className="absolute top-2 right-2 bg-red-900/80 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <CardContent className="p-4">
                                        <h4 className="font-bold truncate text-slate-200">{item.title}</h4>
                                        <p className="text-xs text-slate-500">{item.type}</p>
                                    </CardContent>
                                </Card>
                            ))}
                            {galleryItems.length === 0 && (
                                <div className="col-span-full text-center py-12 text-slate-500 border-2 border-slate-800 border-dashed rounded-xl">
                                    No gallery items found.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* --- SETTINGS TAB --- */}
                    {currentAdmin?.role === "SUPER_ADMIN" && (
                        <TabsContent value="settings" className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-200">System Settings & Data Management</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Certificate Signatures Card */}
                                <Card className="col-span-full border-blue-900/50 bg-slate-900/80 shadow-xl">
                                    <CardHeader className="border-b border-slate-800 bg-slate-900/50">
                                        <CardTitle className="text-slate-200 flex items-center gap-2">
                                            <UploadIcon className="h-5 w-5 text-blue-400" /> Official Certificate Signatures & Seal
                                        </CardTitle>
                                        <p className="text-xs text-slate-400">
                                            Upload official digital signatures for President, Secretary, Treasurer, and the Official Association Seal. These will be automatically rendered on member certificates.
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {/* PRESIDENT */}
                                            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center space-y-3">
                                                <h4 className="font-bold text-slate-200 text-sm">President Signature</h4>
                                                <div className="h-24 w-full bg-slate-900 rounded-lg border border-dashed border-slate-700 flex items-center justify-center p-2">
                                                    {signatures.presidentSignatureUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={signatures.presidentSignatureUrl} alt="President Signature" className="h-full object-contain" />
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">No signature uploaded</span>
                                                    )}
                                                </div>
                                                <label className="w-full cursor-pointer">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleSignatureUpload("president", file);
                                                        }}
                                                    />
                                                    <Button variant="outline" type="button" className="w-full border-blue-600/50 text-blue-400 hover:bg-blue-900/40 text-xs pointer-events-none">
                                                        {uploadingSignature === "president" ? "Uploading..." : "Upload President Sign"}
                                                    </Button>
                                                </label>
                                            </div>

                                            {/* SECRETARY */}
                                            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center space-y-3">
                                                <h4 className="font-bold text-slate-200 text-sm">Secretary Signature</h4>
                                                <div className="h-24 w-full bg-slate-900 rounded-lg border border-dashed border-slate-700 flex items-center justify-center p-2">
                                                    {signatures.secretarySignatureUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={signatures.secretarySignatureUrl} alt="Secretary Signature" className="h-full object-contain" />
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">No signature uploaded</span>
                                                    )}
                                                </div>
                                                <label className="w-full cursor-pointer">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleSignatureUpload("secretary", file);
                                                        }}
                                                    />
                                                    <Button variant="outline" type="button" className="w-full border-blue-600/50 text-blue-400 hover:bg-blue-900/40 text-xs pointer-events-none">
                                                        {uploadingSignature === "secretary" ? "Uploading..." : "Upload Secretary Sign"}
                                                    </Button>
                                                </label>
                                            </div>

                                            {/* TREASURER */}
                                            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center space-y-3">
                                                <h4 className="font-bold text-slate-200 text-sm">Treasurer Signature</h4>
                                                <div className="h-24 w-full bg-slate-900 rounded-lg border border-dashed border-slate-700 flex items-center justify-center p-2">
                                                    {signatures.treasurerSignatureUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={signatures.treasurerSignatureUrl} alt="Treasurer Signature" className="h-full object-contain" />
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">No signature uploaded</span>
                                                    )}
                                                </div>
                                                <label className="w-full cursor-pointer">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleSignatureUpload("treasurer", file);
                                                        }}
                                                    />
                                                    <Button variant="outline" type="button" className="w-full border-blue-600/50 text-blue-400 hover:bg-blue-900/40 text-xs pointer-events-none">
                                                        {uploadingSignature === "treasurer" ? "Uploading..." : "Upload Treasurer Sign"}
                                                    </Button>
                                                </label>
                                            </div>

                                            {/* OFFICIAL SEAL */}
                                            <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-900/40 flex flex-col items-center space-y-3">
                                                <h4 className="font-bold text-amber-400 text-sm">Official Association Seal</h4>
                                                <div className="h-24 w-full bg-slate-900 rounded-lg border border-dashed border-amber-500/40 flex items-center justify-center p-2">
                                                    {signatures.officialSealUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={signatures.officialSealUrl} alt="Official Seal" className="h-full object-contain" />
                                                    ) : (
                                                        <span className="text-xs text-amber-500/70 italic">No seal uploaded</span>
                                                    )}
                                                </div>
                                                <label className="w-full cursor-pointer">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleSignatureUpload("seal", file);
                                                        }}
                                                    />
                                                    <Button variant="outline" type="button" className="w-full border-amber-600/50 text-amber-400 hover:bg-amber-900/40 text-xs pointer-events-none">
                                                        {uploadingSignature === "seal" ? "Uploading..." : "Upload Official Seal"}
                                                    </Button>
                                                </label>
                                            </div>
                                        </div>
                                    </CardContent>

                                </Card>

                                <Card className="border-red-900/50 bg-red-950/20 shadow-xl">

                                    <CardHeader className="border-b border-red-900/50 bg-red-900/10">
                                        <CardTitle className="text-red-500 flex items-center gap-2">
                                            <Trash2 className="h-5 w-5" /> Danger Zone
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <p className="text-sm text-red-400 mb-6">
                                            This action will permanently delete ALL member data, including partners, payments, generated PDFs, and uploaded photos. This action cannot be undone. Proceed with extreme caution.
                                        </p>
                                        <Button
                                            variant="destructive"
                                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 shadow-lg text-white font-bold"
                                            onClick={handleDataReset}
                                        >
                                            Wipe All Membership Data
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-blue-900/50 bg-blue-950/20 shadow-xl">
                                    <CardHeader className="border-b border-blue-900/50 bg-blue-900/10">
                                        <CardTitle className="text-blue-400 flex items-center gap-2">
                                            <Save className="h-5 w-5" /> Data Backup & Restore
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-blue-300 mb-2">Create Backup</h4>
                                            <p className="text-sm text-blue-400/80 mb-4">
                                                Download a complete ZIP archive of the `dev.db` database and all `uploads` (photos, GST docs, receipts).
                                            </p>
                                            <Button
                                                onClick={handleBackup}
                                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                                            >
                                                <Download className="mr-2 h-4 w-4" /> Download Full Backup
                                            </Button>
                                        </div>

                                        <div className="pt-6 border-t border-blue-900/50">
                                            <h4 className="font-semibold text-blue-300 mb-2">Restore Backup</h4>
                                            <p className="text-sm text-blue-400/80 mb-4">
                                                Upload a generated ZIP backup to restore the system. <strong className="text-red-400">This overrides all current data!</strong>
                                            </p>
                                            <form onSubmit={handleRestore} className="flex flex-col sm:flex-row gap-3">
                                                <Input
                                                    type="file"
                                                    name="backupFile"
                                                    accept=".zip"
                                                    required
                                                    className="bg-slate-900 border-blue-800 text-slate-200 file:text-slate-200 focus-visible:ring-blue-500"
                                                />
                                                <Button type="submit" variant="outline" className="border-blue-600/50 text-blue-400 hover:bg-blue-900/50 shrink-0">
                                                    <UploadIcon className="mr-2 h-4 w-4" /> Restore
                                                </Button>
                                            </form>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </main>
        </div>
    );
}
