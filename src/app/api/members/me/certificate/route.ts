import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import fs from "fs";
import path from "path";
import React from "react";
import QRCode from "qrcode";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    Svg,
    Path,
    Font,
    renderToBuffer,
} from "@react-pdf/renderer";
import { getFinancialYear } from "@/lib/financial-year";

let fontRegistered = false;
function ensureFontRegistered() {
    if (fontRegistered) return;
    const fontPath = path.join(process.cwd(), "public", "fonts", "FranklinGothicHeavy.ttf");
    if (fs.existsSync(fontPath)) {
        Font.register({
            family: "FranklinGothicHeavy",
            src: fontPath,
        });
    }
    fontRegistered = true;
}

function formatTitleCase(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
        .join(" ");
}

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

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#f1f5f9",
        position: "relative",
        padding: 22,
    },
    outerBorder: {
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        bottom: 12,
        borderWidth: 2,
        borderColor: "#1e3a8a",
        zIndex: 0,
    },
    middleBorder: {
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        bottom: 16,
        borderWidth: 1,
        borderColor: "#d94f15",
        zIndex: 0,
    },
    innerBorder: {
        position: "absolute",
        top: 19,
        left: 19,
        right: 19,
        bottom: 19,
        borderWidth: 0.5,
        borderColor: "#94a3b8",
        zIndex: 0,
    },
    watermarkContainer: {
        position: "absolute",
        top: "30%",
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: -1,
    },
    watermark: {
        width: 360,
        height: 360,
        opacity: 0.14,
    },
    contentContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 15,
        paddingBottom: 10,
        paddingHorizontal: 25,
        zIndex: 1,
    },
    headerCol: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    headerLogo: {
        width: 154,
        height: 120,
        objectFit: "contain",
        marginBottom: 6,
    },
    regNoSubtitle: {
        fontSize: 11,
        color: "#000000",
        fontFamily: "Helvetica-Bold",
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    headerTitleText: {
        fontSize: 34,
        color: "#d94f15",
        fontFamily: "FranklinGothicHeavy",
        textAlign: "center",
        lineHeight: 1.15,
    },
    committeePill: {
        backgroundColor: "#d94f15",
        paddingHorizontal: 20,
        paddingVertical: 4,
        borderRadius: 14,
        marginTop: 10,
        marginBottom: 4,
    },
    committeeText: {
        color: "#ffffff",
        fontSize: 10.5,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
    },
    dividerLine: {
        width: "100%",
        height: 1,
        backgroundColor: "#cbd5e1",
        marginVertical: 4,
    },
    certificateTitleBlock: {
        alignItems: "center",
        width: "100%",
    },
    certificateTitle: {
        fontSize: 28,
        color: "#1e3a8a",
        fontFamily: "Times-Bold",
        letterSpacing: 3,
        textAlign: "center",
        marginTop: 6,
    },
    certificateSubTitle: {
        fontSize: 10,
        color: "#d94f15",
        fontFamily: "Helvetica-Bold",
        letterSpacing: 4,
        marginTop: 3,
        marginBottom: 6,
        textAlign: "center",
    },
    certifySection: {
        alignItems: "center",
        width: "100%",
        marginTop: 6,
    },
    certifyText: {
        fontSize: 13,
        color: "#475569",
        fontFamily: "Times-Italic",
        marginBottom: 8,
        textAlign: "center",
    },
    memberName: {
        fontSize: 30,
        color: "#1e3a8a",
        fontFamily: "Times-BoldItalic",
        textAlign: "center",
        marginBottom: 4,
        paddingHorizontal: 20,
    },
    nameDivider: {
        width: 240,
        height: 1.5,
        backgroundColor: "#d94f15",
        marginBottom: 12,
    },
    membershipBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        marginBottom: 12,
    },
    membershipIdLabel: {
        fontSize: 10,
        color: "#64748b",
        fontFamily: "Helvetica-Bold",
        marginRight: 6,
    },
    membershipIdValue: {
        fontSize: 12,
        color: "#1e3a8a",
        fontFamily: "Helvetica-Bold",
        letterSpacing: 1,
    },
    bodyTextContainer: {
        width: "90%",
        alignItems: "center",
    },
    bodyTextLine: {
        fontSize: 11,
        color: "#334155",
        fontFamily: "Times-Roman",
        textAlign: "center",
        lineHeight: 1.5,
    },
    boldBlue: {
        color: "#1e3a8a",
        fontFamily: "Times-Bold",
    },
    qrAndSealRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginTop: 8,
        position: "relative",
        minHeight: 90,
    },
    qrSection: {
        alignItems: "center",
    },
    qrImage: {
        width: 68,
        height: 68,
        padding: 3,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
    },
    qrText: {
        fontSize: 8,
        color: "#64748b",
        marginTop: 3,
        fontFamily: "Helvetica",
    },
    sealSection: {
        position: "absolute",
        right: 45,
        alignItems: "center",
        justifyContent: "center",
    },
    sealImage: {
        width: 104,
        height: 104,
        objectFit: "contain",
        opacity: 0.9,
    },
    signaturesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        width: "100%",
        paddingHorizontal: 15,
        marginTop: 10,
    },
    signatureBlock: {
        alignItems: "center",
        width: 130,
    },
    signatureImage: {
        width: 104,
        height: 46,
        objectFit: "contain",
        marginBottom: 4,
    },
    signaturePlaceholder: {
        height: 36,
    },
    signatureName: {
        fontSize: 10,
        color: "#1e3a8a",
        fontFamily: "Times-Bold",
        marginBottom: 1,
    },
    signatureLabel: {
        fontSize: 8,
        color: "#64748b",
        fontFamily: "Helvetica",
        textTransform: "uppercase",
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

        const member = await prisma.member.findUnique({
            where: { id: memberId },
            select: {
                companyName: true,
                membershipId: true,
                status: true,
            },
        });

        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        if (member.status !== "ACTIVE") {
            return NextResponse.json(
                { message: "Certificate is available once your membership is Active." },
                { status: 403 }
            );
        }

        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: [
                        "president_signature_url",
                        "secretary_signature_url",
                        "treasurer_signature_url",
                        "official_seal_url",
                    ],
                },
            },
        });
        const settingsMap: Record<string, string> = {};
        settings.forEach((s) => {
            settingsMap[s.key] = s.value;
        });

        ensureFontRegistered();

        const membershipId = member.membershipId || "PENDING";
        const serialNumber = membershipId.startsWith("AKITDA")
            ? membershipId
            : membershipId.replace(/^AKEKM(\d+)$/i, "AKITDA | EKM | $1");

        const logoDataUri = resolvePublicImageDataUri("/akitda-logo.png");
        const presidentSig = resolvePublicImageDataUri(settingsMap["president_signature_url"]);
        const secretarySig = resolvePublicImageDataUri(settingsMap["secretary_signature_url"]);
        const treasurerSig = resolvePublicImageDataUri(settingsMap["treasurer_signature_url"]);
        const officialSeal = resolvePublicImageDataUri(settingsMap["official_seal_url"]);
        const qrDataUri = await QRCode.toDataURL(membershipId, { width: 150, margin: 1 });
        const financialYear = getFinancialYear().label;

        const hasCustomFont = fs.existsSync(
            path.join(process.cwd(), "public", "fonts", "FranklinGothicHeavy.ttf")
        );
        const titleStyle = hasCustomFont
            ? styles.headerTitleText
            : { ...styles.headerTitleText, fontFamily: "Helvetica-Bold" };

        const doc = React.createElement(
            Document,
            null,
            React.createElement(
                Page,
                { size: "A4", orientation: "portrait", style: styles.page },
                React.createElement(View, { style: styles.outerBorder }),
                React.createElement(View, { style: styles.middleBorder }),
                React.createElement(View, { style: styles.innerBorder }),
                React.createElement(
                    Svg,
                    { width: "30", height: "30", viewBox: "0 0 30 30", style: { position: "absolute", top: 11, left: 11, zIndex: 5 } },
                    React.createElement(Path, { d: "M 0 0 L 25 0 L 25 3 L 3 3 L 3 25 L 0 25 Z", fill: "#1e3a8a" }),
                    React.createElement(Path, { d: "M 5 5 L 20 5 L 20 7 L 7 7 L 7 20 L 5 20 Z", fill: "#d94f15" }),
                    React.createElement(Path, { d: "M 9 9 L 14 9 L 14 14 L 9 14 Z", fill: "#1e3a8a" })
                ),
                React.createElement(
                    Svg,
                    { width: "30", height: "30", viewBox: "0 0 30 30", style: { position: "absolute", top: 11, right: 11, zIndex: 5 } },
                    React.createElement(Path, { d: "M 30 0 L 5 0 L 5 3 L 27 3 L 27 25 L 30 25 Z", fill: "#1e3a8a" }),
                    React.createElement(Path, { d: "M 25 5 L 10 5 L 10 7 L 23 7 L 23 20 L 25 20 Z", fill: "#d94f15" }),
                    React.createElement(Path, { d: "M 21 9 L 16 9 L 16 14 L 21 14 Z", fill: "#1e3a8a" })
                ),
                React.createElement(
                    Svg,
                    { width: "30", height: "30", viewBox: "0 0 30 30", style: { position: "absolute", bottom: 11, left: 11, zIndex: 5 } },
                    React.createElement(Path, { d: "M 0 30 L 25 30 L 25 27 L 3 27 L 3 5 L 0 5 Z", fill: "#1e3a8a" }),
                    React.createElement(Path, { d: "M 5 25 L 20 25 L 20 23 L 7 23 L 7 10 L 5 10 Z", fill: "#d94f15" }),
                    React.createElement(Path, { d: "M 9 21 L 14 21 L 14 16 L 9 16 Z", fill: "#1e3a8a" })
                ),
                React.createElement(
                    Svg,
                    { width: "30", height: "30", viewBox: "0 0 30 30", style: { position: "absolute", bottom: 11, right: 11, zIndex: 5 } },
                    React.createElement(Path, { d: "M 30 30 L 5 30 L 5 27 L 27 27 L 27 5 L 30 5 Z", fill: "#1e3a8a" }),
                    React.createElement(Path, { d: "M 25 25 L 10 25 L 10 23 L 23 23 L 23 10 L 25 10 Z", fill: "#d94f15" }),
                    React.createElement(Path, { d: "M 21 21 L 16 21 L 16 16 L 21 16 Z", fill: "#1e3a8a" })
                ),
                logoDataUri
                    ? React.createElement(
                          View,
                          { style: styles.watermarkContainer },
                          React.createElement(Image, { src: logoDataUri, style: styles.watermark })
                      )
                    : null,
                React.createElement(
                    View,
                    { style: styles.contentContainer },
                    React.createElement(
                        View,
                        { style: styles.headerCol },
                        logoDataUri
                            ? React.createElement(Image, { src: logoDataUri, style: styles.headerLogo })
                            : null,
                        React.createElement(Text, { style: styles.regNoSubtitle }, "REG. No.ER366/04"),
                        React.createElement(Text, { style: titleStyle }, "All Kerala IT Dealers"),
                        React.createElement(Text, { style: titleStyle }, "Association"),
                        React.createElement(
                            View,
                            { style: styles.committeePill },
                            React.createElement(Text, { style: styles.committeeText }, "Ernakulam District Committee")
                        )
                    ),
                    React.createElement(View, { style: styles.dividerLine }),
                    React.createElement(
                        View,
                        { style: styles.certificateTitleBlock },
                        React.createElement(Text, { style: styles.certificateTitle }, "CERTIFICATE"),
                        React.createElement(Text, { style: styles.certificateSubTitle }, "O F   R E G I S T R A T I O N")
                    ),
                    React.createElement(View, { style: styles.dividerLine }),
                    React.createElement(
                        View,
                        { style: styles.certifySection },
                        React.createElement(Text, { style: styles.certifyText }, "This is to certify that"),
                        React.createElement(Text, { style: styles.memberName }, formatTitleCase(member.companyName)),
                        React.createElement(View, { style: styles.nameDivider }),
                        React.createElement(
                            View,
                            { style: styles.membershipBox },
                            React.createElement(Text, { style: styles.membershipIdLabel }, "MEMBERSHIP ID:"),
                            React.createElement(Text, { style: styles.membershipIdValue }, membershipId)
                        ),
                        React.createElement(
                            View,
                            { style: styles.bodyTextContainer },
                            React.createElement(Text, { style: styles.bodyTextLine }, "is a registered member of the"),
                            React.createElement(
                                Text,
                                { style: [styles.bodyTextLine, styles.boldBlue, { fontSize: 11.5, marginVertical: 3 }] },
                                "All Kerala IT Dealers Association"
                            ),
                            React.createElement(
                                Text,
                                { style: styles.bodyTextLine },
                                "and is hereby entitled to all rights and privileges as envisaged"
                            ),
                            React.createElement(
                                Text,
                                { style: styles.bodyTextLine },
                                "in the bylaws of the Association for the Year ",
                                React.createElement(Text, { style: styles.boldBlue }, financialYear),
                                "."
                            )
                        )
                    ),
                    React.createElement(
                        View,
                        { style: styles.qrAndSealRow },
                        React.createElement(
                            View,
                            { style: styles.qrSection },
                            React.createElement(Image, { src: qrDataUri, style: styles.qrImage }),
                            React.createElement(Text, { style: styles.qrText }, `S/N: ${serialNumber}`)
                        ),
                        officialSeal
                            ? React.createElement(
                                  View,
                                  { style: styles.sealSection },
                                  React.createElement(Image, { src: officialSeal, style: styles.sealImage })
                              )
                            : null
                    ),
                    React.createElement(
                        View,
                        { style: styles.signaturesRow },
                        React.createElement(
                            View,
                            { style: styles.signatureBlock },
                            presidentSig
                                ? React.createElement(Image, { src: presidentSig, style: styles.signatureImage })
                                : React.createElement(View, { style: styles.signaturePlaceholder }),
                            React.createElement(Text, { style: styles.signatureName }, "Antony M.A."),
                            React.createElement(Text, { style: styles.signatureLabel }, "PRESIDENT")
                        ),
                        React.createElement(
                            View,
                            { style: styles.signatureBlock },
                            secretarySig
                                ? React.createElement(Image, { src: secretarySig, style: styles.signatureImage })
                                : React.createElement(View, { style: styles.signaturePlaceholder }),
                            React.createElement(Text, { style: styles.signatureName }, "Navas T. Backer"),
                            React.createElement(Text, { style: styles.signatureLabel }, "SECRETARY")
                        ),
                        React.createElement(
                            View,
                            { style: styles.signatureBlock },
                            treasurerSig
                                ? React.createElement(Image, { src: treasurerSig, style: styles.signatureImage })
                                : React.createElement(View, { style: styles.signaturePlaceholder }),
                            React.createElement(Text, { style: styles.signatureName }, "Subhash T.S"),
                            React.createElement(Text, { style: styles.signatureLabel }, "TREASURER")
                        )
                    )
                )
            )
        );

        const pdfBuffer = await renderToBuffer(doc);
        const safeId = membershipId.replace(/[^A-Za-z0-9_-]/g, "_");

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="AKITDA_Certificate_${safeId}.pdf"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Certificate PDF generation error:", error);
        return NextResponse.json(
            { message: "Failed to generate certificate PDF." },
            { status: 500 }
        );
    }
}
