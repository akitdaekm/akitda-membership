import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import fs from "fs";
import path from "path";
import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    renderToBuffer,
} from "@react-pdf/renderer";

function resolvePublicImageDataUri(urlOrPath?: string | null): string | undefined {
    if (!urlOrPath) return undefined;
    if (urlOrPath.startsWith("data:") || urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
        return urlOrPath;
    }
    const cleanRel = urlOrPath.replace(/^\/+/, "");
    const absPath = path.join(process.cwd(), "public", cleanRel);
    if (!fs.existsSync(absPath)) return undefined;
    const ext = path.extname(absPath).toLowerCase();
    const mime =
        ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
            ? "image/webp"
            : "image/png";
    const buf = fs.readFileSync(absPath);
    return `data:${mime};base64,${buf.toString("base64")}`;
}

function numberToWords(num: number): string {
    const intNum = Math.round(num);
    const a = [
        "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
        "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen ",
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const numStr = intNum.toString();
    if (numStr.length > 9) return "Rupees Only";
    const n = ("000000000" + numStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";
    let str = "";
    str += parseInt(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + " " + a[Number(n[1][1])]) + "Crore " : "";
    str += parseInt(n[2]) !== 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + " " + a[Number(n[2][1])]) + "Lakh " : "";
    str += parseInt(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + " " + a[Number(n[3][1])]) + "Thousand " : "";
    str += parseInt(n[4]) !== 0 ? (a[Number(n[4])] || b[Number(n[4][0])] + " " + a[Number(n[4][1])]) + "Hundred " : "";
    str += parseInt(n[5]) !== 0 ? ((str !== "" ? "and " : "") + (a[Number(n[5])] || b[Number(n[5][0])] + " " + a[Number(n[5][1])])) : "";
    return str + "Rupees Only";
}

const styles = StyleSheet.create({
    page: { padding: 20, fontFamily: "Helvetica", fontSize: 10 },
    header: { alignItems: "center", marginBottom: 10 },
    title: { color: "#1e40af", fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 2 },
    subtitle: { color: "#1e40af", fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 },
    districtLine: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 },
    addressLine: { fontSize: 8, color: "#666666", textAlign: "center", marginBottom: 1 },
    badge: {
        marginTop: 8,
        backgroundColor: "#1d4ed8",
        color: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 10,
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
    },
    divider: { height: 1, backgroundColor: "#1e40af", marginVertical: 15, width: "100%" },
    row: { flexDirection: "row", marginBottom: 12, alignItems: "center" },
    label: { width: 100, color: "#666666", fontSize: 10 },
    value: { flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold" },
    valueBig: { flex: 1, fontSize: 12, fontFamily: "Helvetica-Bold" },
    receiptNoDateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    receiptNoLabel: { fontSize: 10, color: "#666666" },
    receiptNoValue: { fontSize: 12, color: "#dc2626", fontFamily: "Helvetica-Bold" },
    dateLabel: { fontSize: 10, color: "#666666" },
    dateValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
    amountRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
    amountText: { fontSize: 10, fontFamily: "Helvetica-Oblique", color: "#444444", marginLeft: 5, marginTop: 2 },
    paymentRow: { flexDirection: "row", backgroundColor: "#f8fafc", padding: 8, marginTop: 20, alignItems: "center" },
    checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: "#000000", marginRight: 4 },
    checked: { backgroundColor: "#000000" },
    paymentLabel: { marginRight: 16, fontSize: 10, flexDirection: "row", alignItems: "center" },
    footerSection: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    signatureBlock: { alignItems: "center", borderTopWidth: 1, borderColor: "#cccccc", paddingTop: 4, width: 150 },
    watermark: {
        position: "absolute",
        top: 200,
        left: 100,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        transform: "rotate(-45deg)",
        fontSize: 80,
        color: "#999999",
        zIndex: -1,
    },
});

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        let tokenValue = "";

        if (authHeader && authHeader.startsWith("Bearer ")) {
            tokenValue = authHeader.split(" ")[1];
        } else {
            const cookieStore = await cookies();
            const cookieToken = cookieStore.get("member_token");
            if (cookieToken) {
                tokenValue = cookieToken.value;
            }
        }

        if (!tokenValue) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret_dev_only"
        );
        const { payload } = await jwtVerify(tokenValue, secret);
        const memberId = payload.id as string;

        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get("paymentId");

        const member = await prisma.member.findUnique({
            where: { id: memberId },
            select: {
                companyName: true,
                unit: true,
                payments: {
                    where: paymentId ? { id: paymentId } : { status: "PAID" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        const payment = member.payments[0];
        if (!payment || payment.status !== "PAID") {
            return NextResponse.json(
                { message: "No verified payment receipt found." },
                { status: 404 }
            );
        }

        const settings = await prisma.setting.findMany({
            where: { key: { in: ["treasurer_signature_url", "official_seal_url"] } },
        });
        const settingsMap: Record<string, string> = {};
        settings.forEach((s) => {
            settingsMap[s.key] = s.value;
        });

        const logoDataUri = resolvePublicImageDataUri("/akitda-logo.png");
        const treasurerSig = resolvePublicImageDataUri(settingsMap["treasurer_signature_url"]);
        const officialSeal = resolvePublicImageDataUri(settingsMap["official_seal_url"]);
        const receiptNumber = payment.receiptNumber || `REC-${payment.year}`;
        const dateStr = new Date(payment.paymentDate || payment.createdAt).toLocaleDateString("en-IN");

        const doc = React.createElement(
            Document,
            null,
            React.createElement(
                Page,
                { size: "A5", style: styles.page },
                React.createElement(
                    View,
                    { style: styles.watermark },
                    React.createElement(Text, null, "AKITDA")
                ),
                React.createElement(
                    View,
                    { style: styles.header },
                    logoDataUri
                        ? React.createElement(Image, { src: logoDataUri, style: { width: 60, height: 60, marginBottom: 5 } })
                        : null,
                    React.createElement(Text, { style: styles.title }, "ALL KERALA IT DEALERS"),
                    React.createElement(Text, { style: styles.subtitle }, "ASSOCIATION"),
                    React.createElement(Text, { style: styles.districtLine }, "ERNAKULAM DISTRICT COMMITTEE"),
                    React.createElement(
                        Text,
                        { style: styles.addressLine },
                        "1st Floor, Krishnakripa, KSN Menon Rd, Ravipuram, Perumanoor,"
                    ),
                    React.createElement(Text, { style: styles.addressLine }, "Ernakulam - 682016"),
                    React.createElement(
                        Text,
                        { style: styles.addressLine },
                        "Phone: 085470 26604 | Email: support@akitdaekm.com | REG. No.ER366/04"
                    ),
                    React.createElement(
                        View,
                        { style: styles.badge },
                        React.createElement(Text, null, "OFFICIAL RECEIPT")
                    )
                ),
                React.createElement(View, { style: styles.divider }),
                React.createElement(
                    View,
                    { style: styles.receiptNoDateRow },
                    React.createElement(
                        View,
                        null,
                        React.createElement(Text, { style: styles.receiptNoLabel }, "Receipt No:"),
                        React.createElement(Text, { style: styles.receiptNoValue }, receiptNumber)
                    ),
                    React.createElement(
                        View,
                        null,
                        React.createElement(Text, { style: styles.dateLabel }, "Date:"),
                        React.createElement(Text, { style: styles.dateValue }, dateStr)
                    )
                ),
                React.createElement(
                    View,
                    { style: styles.row },
                    React.createElement(Text, { style: styles.label }, "Received from:"),
                    React.createElement(Text, { style: styles.valueBig }, member.companyName.toUpperCase())
                ),
                React.createElement(
                    View,
                    { style: styles.row },
                    React.createElement(Text, { style: styles.label }, "District/Unit:"),
                    React.createElement(Text, { style: styles.value }, `Ernakulam / ${member.unit}`)
                ),
                React.createElement(
                    View,
                    { style: styles.amountRow },
                    React.createElement(Text, { style: styles.label }, "The sum of ₹:"),
                    React.createElement(
                        View,
                        { style: { flex: 1 } },
                        React.createElement(
                            Text,
                            { style: styles.valueBig },
                            `${payment.amount.toLocaleString("en-IN")}/- `,
                            React.createElement(Text, { style: styles.amountText }, `(${numberToWords(payment.amount)})`)
                        )
                    )
                ),
                React.createElement(
                    View,
                    { style: styles.row },
                    React.createElement(Text, { style: styles.label }, "Towards:"),
                    React.createElement(Text, { style: styles.value }, "Membership Fees")
                ),
                React.createElement(
                    View,
                    { style: styles.paymentRow },
                    React.createElement(Text, { style: { fontSize: 10, marginRight: 10, color: "#666666" } }, "Payment Mode:"),
                    React.createElement(
                        View,
                        { style: styles.paymentLabel },
                        React.createElement(View, { style: styles.checkbox }),
                        React.createElement(Text, null, "Cash")
                    ),
                    React.createElement(
                        View,
                        { style: styles.paymentLabel },
                        React.createElement(View, { style: [styles.checkbox, styles.checked] }),
                        React.createElement(Text, null, "UPI")
                    ),
                    React.createElement(
                        View,
                        { style: styles.paymentLabel },
                        React.createElement(View, { style: styles.checkbox }),
                        React.createElement(Text, null, "Cheque/Bank")
                    )
                ),
                React.createElement(
                    View,
                    { style: styles.footerSection },
                    React.createElement(
                        View,
                        { style: { alignItems: "flex-start", justifyContent: "flex-end" } },
                        officialSeal
                            ? React.createElement(Image, {
                                  src: officialSeal,
                                  style: { width: 50, height: 50, objectFit: "contain", marginBottom: 2 },
                              })
                            : null,
                        React.createElement(Text, { style: { fontSize: 8, color: "#999999" } }, "Thank you for your support!"),
                        React.createElement(Text, { style: { fontSize: 8, color: "#999999" } }, "Subject to realization of cheque.")
                    ),
                    React.createElement(
                        View,
                        { style: styles.signatureBlock },
                        treasurerSig
                            ? React.createElement(Image, {
                                  src: treasurerSig,
                                  style: { width: 90, height: 32, objectFit: "contain", marginBottom: 2 },
                              })
                            : React.createElement(View, { style: { height: 32 } }),
                        React.createElement(Text, { style: { fontSize: 10, fontFamily: "Helvetica-Bold" } }, "Authorized Signatory"),
                        React.createElement(Text, { style: { fontSize: 8, color: "#666666" } }, "Treasurer / AKITDA")
                    )
                )
            )
        );

        const pdfBuffer = await renderToBuffer(doc);
        const safeRec = receiptNumber.replace(/[^A-Za-z0-9_-]/g, "_");

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="AKITDA_Receipt_${safeRec}.pdf"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Receipt PDF generation error:", error);
        return NextResponse.json(
            { message: "Failed to generate receipt PDF." },
            { status: 500 }
        );
    }
}
