"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Plus, Building2, Phone, Users, FileText } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const companyTypes = [
    "Proprietorship",
    "Partnership",
    "LLP",
    "Private Limited",
] as const;

const formSchema = z.object({
    memberType: z.enum(["NEW", "EXISTING"]),
    membershipId: z.string().optional(),
    companyName: z.string().min(2, "Company name must be at least 2 characters."),
    companyType: z.enum(companyTypes),
    addressBuilding: z.string().min(2, "Building name/no is required."),
    addressArea: z.string().min(3, "Area is required."),
    district: z.string().min(2, "District is required."),
    pincode: z.string().length(6, "Pincode must be 6 digits."),
    unit: z.string().min(2, "Unit is required."),
    primaryMobile: z.string().length(10, "Mobile number must be 10 digits."),
    primaryEmail: z.string().email("Invalid email address."),
    gstNumber: z.string().length(15, "GST Number must be 15 characters."),
    partners: z
        .array(
            z.object({
                name: z.string().min(2, "Partner name is required"),
                phone: z.string().optional(),
                email: z.string().email("Invalid email").optional().or(z.literal("")),
            })
        )
        .min(1, "At least one partner/proprietor is required."),
});

type FormValues = z.infer<typeof formSchema>;

export function RegistrationForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // File states
    const [gstFile, setGstFile] = useState<File | null>(null);
    // Map to store partner photos: index -> File
    const [partnerPhotos, setPartnerPhotos] = useState<Record<number, File | null>>({});

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            memberType: "NEW",
            membershipId: "",
            companyName: "",
            companyType: "Proprietorship",
            addressBuilding: "",
            addressArea: "",
            district: "",
            pincode: "",
            unit: "",
            primaryMobile: "",
            primaryEmail: "",
            gstNumber: "",
            partners: [{ name: "", phone: "", email: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "partners",
    });

    const selectedCompanyType = form.watch("companyType");

    const handlePartnerPhotoChange = (index: number, file: File | null) => {
        setPartnerPhotos(prev => ({
            ...prev,
            [index]: file
        }));
    };

    const handleRemovePartner = (index: number) => {
        remove(index);
        // Cleanup photo state
        setPartnerPhotos(prev => {
            const newState = { ...prev };
            delete newState[index];
            // Shift keys if necessary, but simple delete is enough if we rely on index during submission matching
            // Actually, if we remove index 1, index 2 becomes 1 in the form fields.
            // So we need to shift the photos as well.
            // For simplicity in this demo, we might just reset or ask to re-upload if logic gets complex.
            // Let's implement shifting for better UX.
            const shiftedState: Record<number, File | null> = {};
            Object.keys(newState).forEach(key => {
                const k = parseInt(key);
                if (k < index) shiftedState[k] = newState[k];
                if (k > index) shiftedState[k - 1] = newState[k];
            });
            return shiftedState;
        });
    };

    async function onSubmit(values: FormValues) {
        if (!gstFile) {
            alert("Please upload GST Certificate.");
            return;
        }

        // Validate that all partners have photos (optional, based on requirement)
        // User said "add the option", implying it might be required or optional.
        // Let's assume required to avoid issues.
        // Check if map sizes match or check loop.
        /* 
        for (let i = 0; i < values.partners.length; i++) {
            if (!partnerPhotos[i]) {
                alert(`Please upload photo for partner ${i + 1}`);
                return;
            }
        }
        */

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("data", JSON.stringify(values));
            formData.append("gstFile", gstFile);

            // Append partner photos
            values.partners.forEach((_, index) => {
                if (partnerPhotos[index]) {
                    formData.append(`partnerPhoto_${index}`, partnerPhotos[index]!);
                }
            });

            const response = await fetch("/api/register", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Registration failed");
            }

            alert("Registration successful! Please wait for admin approval.");
            router.push("/");
        } catch (error: any) {
            console.error(error);
            alert(error.message || "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* COMPANY DETAILS CARD */}
                <Card className="border border-blue-900/50 shadow-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af]">
                    <CardHeader className="bg-white/5 border-b border-blue-400/20 text-white backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-6 w-6 text-cyan-400" />
                            <div>
                                <CardTitle className="text-xl font-bold tracking-wide">Company Details</CardTitle>
                                <CardDescription className="text-blue-200">Enter your business information.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tech Solutions" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="companyType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {companyTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="addressBuilding"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Building Name / No.</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Building Name, Flat No" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="addressArea"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Local Area / Street</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Street Name, Area" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="district"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>District</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ernakulam" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="pincode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pincode</FormLabel>
                                    <FormControl>
                                        <Input placeholder="682001" {...field} max={6} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Unit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Aluva">Aluva</SelectItem>
                                            <SelectItem value="Perumbavoor">Perumbavoor</SelectItem>
                                            <SelectItem value="Paravoor">Paravoor</SelectItem>
                                            <SelectItem value="Kothamangalam">Kothamangalam</SelectItem>
                                            <SelectItem value="Angamaly">Angamaly</SelectItem>
                                            <SelectItem value="Vypin">Vypin</SelectItem>
                                            <SelectItem value="Edappally">Edappally</SelectItem>
                                            <SelectItem value="Kacheripady">Kacheripady</SelectItem>
                                            <SelectItem value="Panambilly Nagar">Panambilly Nagar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* CONTACT INFO CARD */}
                <Card className="border border-blue-900/50 shadow-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] mt-8">
                    <CardHeader className="bg-white/5 border-b border-blue-400/20 text-white backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Phone className="h-6 w-6 text-cyan-400" />
                            <div>
                                <CardTitle className="text-xl font-bold tracking-wide">Contact Information</CardTitle>
                                <CardDescription className="text-blue-200">Used for OTP verification, password resets, and security updates.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="primaryMobile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Primary Mobile</FormLabel>
                                    <FormControl>
                                        <Input placeholder="9876543210" {...field} type="tel" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="primaryEmail"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-2">
                                    <FormLabel>Primary Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="info@company.com" {...field} type="email" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* PARTNERS CARD */}
                <Card className="border border-blue-900/50 shadow-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] mt-8">
                    <CardHeader className="bg-white/5 border-b border-blue-400/20 text-white backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Users className="h-6 w-6 text-cyan-400" />
                            <div>
                                <CardTitle className="text-xl font-bold tracking-wide">Partners / Proprietors</CardTitle>
                                <CardDescription className="text-blue-200">Add details of all partners or the proprietor.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid md:grid-cols-4 gap-4 items-end border border-blue-400/20 p-4 rounded-xl bg-white/5 relative backdrop-blur-sm">
                                <FormField
                                    control={form.control}
                                    name={`partners.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`partners.${index}.phone`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`partners.${index}.email`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* PARTNER PHOTO UPLOAD */}
                                <div className="space-y-2">
                                    <FormLabel>Photo (Passport Size)</FormLabel>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handlePartnerPhotoChange(index, e.target.files?.[0] || null)}
                                    />
                                    {partnerPhotos[index] && (
                                        <p className="text-xs text-green-600 truncate max-w-[150px]">{partnerPhotos[index]?.name}</p>
                                    )}
                                </div>

                                {index > 0 && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleRemovePartner(index)}
                                        className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-sm"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {selectedCompanyType !== "Proprietorship" && (
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-2"
                                onClick={() => append({ name: "", phone: "", email: "" })}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Partner
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* DOCUMENTS CARD */}
                <Card className="border border-blue-900/50 shadow-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] mt-8">
                    <CardHeader className="bg-white/5 border-b border-blue-400/20 text-white backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-cyan-400" />
                            <div>
                                <CardTitle className="text-xl font-bold tracking-wide">Documents</CardTitle>
                                <CardDescription className="text-blue-200">Upload necessary documents.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="gstNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>GST Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="GSTIN..." {...field} className="uppercase" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>GST Certificate (PDF/Image)</FormLabel>
                            <Input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setGstFile(e.target.files?.[0] || null)}
                            />
                            {gstFile && <p className="text-sm text-muted-foreground">{gstFile.name}</p>}
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500 transition-all font-semibold tracking-wide" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Registration"}
                </Button>
            </form>
        </Form>
    );
}
