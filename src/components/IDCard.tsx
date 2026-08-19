"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { getFinancialYear } from "@/lib/financial-year";

// Standard CR80 ID Card dimensions in points (85.6mm x 54mm)
const CARD_WIDTH = 242.64;
const CARD_HEIGHT = 153.07;

const styles = StyleSheet.create({
    page: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        flexDirection: "column",
        backgroundColor: "#ffffff",
        position: "relative",
        padding: 0,
    },
    // Front Styles
    headerStrip: {
        height: 34,
        backgroundColor: "#0f172a", // Dark Slate / Navy
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        borderBottomWidth: 2,
        borderBottomColor: "#d94f15", // Orange accent
    },
    logo: {
        width: 24,
        height: 24,
        objectFit: "contain",
    },
    headerTextCol: {
        flex: 1,
        marginLeft: 6,
        justifyContent: "center",
    },
    orgName: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
        letterSpacing: 0.2,
    },
    orgSubtitle: {
        fontSize: 5.5,
        fontFamily: "Helvetica",
        color: "#fb923c", // Accent orange/amber
        marginTop: 1,
    },
    bodyRow: {
        flexDirection: "row",
        flex: 1,
        padding: 6,
        alignItems: "stretch",
    },
    photoCol: {
        width: 52,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    photoFrame: {
        width: 48,
        height: 54,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    photo: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    qrCode: {
        width: 38,
        height: 38,
        marginTop: 4,
    },
    qrLabel: {
        fontSize: 4.5,
        color: "#64748b",
        fontFamily: "Helvetica",
        marginTop: 1,
    },
    infoCol: {
        flex: 1,
        marginLeft: 6,
        justifyContent: "space-between",
    },
    companyName: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#1e3a8a",
        marginBottom: 1,
    },
    proprietorName: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: "#334155",
        marginBottom: 3,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 3,
    },
    idBadge: {
        backgroundColor: "#e0f2fe",
        borderWidth: 0.5,
        borderColor: "#0284c7",
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 3,
    },
    idBadgeText: {
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        color: "#0369a1",
    },
    yearBadge: {
        backgroundColor: "#fef3c7",
        borderWidth: 0.5,
        borderColor: "#d97706",
        paddingHorizontal: 4,
        paddingVertical: 1.5,
        borderRadius: 3,
        marginLeft: 4,
    },
    yearBadgeText: {
        fontSize: 6,
        fontFamily: "Helvetica-Bold",
        color: "#b45309",
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 1.5,
    },
    detailLabel: {
        fontSize: 5.5,
        fontFamily: "Helvetica-Bold",
        color: "#64748b",
        width: 32,
    },
    detailValue: {
        fontSize: 5.5,
        fontFamily: "Helvetica",
        color: "#0f172a",
        flex: 1,
    },
    footerRow: {
        height: 22,
        backgroundColor: "#f1f5f9",
        borderTopWidth: 0.5,
        borderTopColor: "#e2e8f0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
    },
    sigBlock: {
        alignItems: "center",
        justifyContent: "center",
        width: 60,
    },
    sigImg: {
        height: 12,
        width: 45,
        objectFit: "contain",
    },
    sigPlaceholder: {
        height: 10,
    },
    sigTitle: {
        fontSize: 4.5,
        fontFamily: "Helvetica-Bold",
        color: "#475569",
        textTransform: "uppercase",
    },

    // Back Side Styles
    backPage: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        flexDirection: "column",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        padding: 8,
        justifyContent: "space-between",
    },
    backHeader: {
        borderBottomWidth: 1,
        borderBottomColor: "#d94f15",
        paddingBottom: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backHeaderTitle: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: "#ffffff",
        letterSpacing: 0.5,
    },
    backHeaderSub: {
        fontSize: 5,
        fontFamily: "Helvetica",
        color: "#94a3b8",
    },
    termsSection: {
        marginVertical: 4,
    },
    termItem: {
        fontSize: 5,
        fontFamily: "Helvetica",
        color: "#cbd5e1",
        marginBottom: 2.5,
        lineHeight: 1.25,
    },
    contactBox: {
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderRadius: 4,
        padding: 4,
        borderWidth: 0.5,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    contactTitle: {
        fontSize: 5.5,
        fontFamily: "Helvetica-Bold",
        color: "#fb923c",
        marginBottom: 2,
    },
    contactText: {
        fontSize: 4.8,
        fontFamily: "Helvetica",
        color: "#e2e8f0",
        marginBottom: 1,
    },
});

export interface IDCardProps {
    companyName: string;
    proprietorName?: string;
    membershipId: string;
    primaryMobile: string;
    primaryEmail?: string;
    district?: string;
    unit?: string;
    profilePhoto?: string | null;
    financialYear?: string;
    presidentSignatureUrl?: string | null;
    secretarySignatureUrl?: string | null;
    officialSealUrl?: string | null;
}

export const MemberIDCardDocument = ({
    companyName,
    proprietorName,
    membershipId,
    primaryMobile,
    primaryEmail,
    district = "Ernakulam",
    unit,
    profilePhoto,
    financialYear = getFinancialYear().label,
    presidentSignatureUrl,
    secretarySignatureUrl,
    officialSealUrl,
}: IDCardProps) => {
    const formattedId = membershipId || "PENDING";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(formattedId)}`;
    const photoUrl = profilePhoto || "/akitda-logo.png";

    return (
        <Document title={`AKITDA_ID_Card_${formattedId}`}>
            {/* FRONT SIDE */}
            <Page size={[CARD_WIDTH, CARD_HEIGHT]} orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.headerStrip}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src="/akitda-logo.png" style={styles.logo} />
                    <View style={styles.headerTextCol}>
                        <Text style={styles.orgName}>ALL KERALA IT DEALERS ASSOCIATION</Text>
                        <Text style={styles.orgSubtitle}>
                            {district ? `${district} District Committee` : "Ernakulam District Committee"}
                        </Text>
                    </View>
                </View>

                {/* Body Content */}
                <View style={styles.bodyRow}>
                    {/* Photo & QR Column */}
                    <View style={styles.photoCol}>
                        <View style={styles.photoFrame}>
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            <Image src={photoUrl} style={styles.photo} />
                        </View>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image src={qrUrl} style={styles.qrCode} />
                        <Text style={styles.qrLabel}>SCAN TO VERIFY</Text>
                    </View>

                    {/* Information Column */}
                    <View style={styles.infoCol}>
                        <View>
                            <Text style={styles.companyName}>
                                {companyName}
                            </Text>
                            {proprietorName && (
                                <Text style={styles.proprietorName}>
                                    {proprietorName}
                                </Text>
                            )}

                            <View style={styles.badgeRow}>
                                <View style={styles.idBadge}>
                                    <Text style={styles.idBadgeText}>ID: {formattedId}</Text>
                                </View>
                                <View style={styles.yearBadge}>
                                    <Text style={styles.yearBadgeText}>{financialYear}</Text>
                                </View>
                            </View>
                        </View>

                        <View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>MOBILE:</Text>
                                <Text style={styles.detailValue}>{primaryMobile || "N/A"}</Text>
                            </View>
                            {primaryEmail && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>EMAIL:</Text>
                                    <Text style={styles.detailValue}>
                                        {primaryEmail}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>UNIT/DIST:</Text>
                                <Text style={styles.detailValue}>
                                    {unit ? `${unit} (${district})` : district}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer Signatures */}
                <View style={styles.footerRow}>
                    <View style={styles.sigBlock}>
                        {presidentSignatureUrl ? (
                            /* eslint-disable-next-line jsx-a11y/alt-text */
                            <Image src={presidentSignatureUrl} style={styles.sigImg} />
                        ) : (
                            <View style={styles.sigPlaceholder} />
                        )}
                        <Text style={styles.sigTitle}>PRESIDENT</Text>
                    </View>

                    {officialSealUrl ? (
                        /* eslint-disable-next-line jsx-a11y/alt-text */
                        <Image src={officialSealUrl} style={{ width: 18, height: 18, objectFit: "contain" }} />
                    ) : null}

                    <View style={styles.sigBlock}>
                        {secretarySignatureUrl ? (
                            /* eslint-disable-next-line jsx-a11y/alt-text */
                            <Image src={secretarySignatureUrl} style={styles.sigImg} />
                        ) : (
                            <View style={styles.sigPlaceholder} />
                        )}
                        <Text style={styles.sigTitle}>SECRETARY</Text>
                    </View>
                </View>
            </Page>

            {/* BACK SIDE */}
            <Page size={[CARD_WIDTH, CARD_HEIGHT]} orientation="landscape" style={styles.backPage}>
                <View style={styles.backHeader}>
                    <Text style={styles.backHeaderTitle}>AKITDA MEMBER IDENTITY CARD</Text>
                    <Text style={styles.backHeaderSub}>Reg. No. ER366/04</Text>
                </View>

                <View style={styles.termsSection}>
                    <Text style={styles.termItem}>
                        1. This card is non-transferable and remains the official property of AKITDA.
                    </Text>
                    <Text style={styles.termItem}>
                        2. Members must present this card to avail official association benefits and voting rights.
                    </Text>
                    <Text style={styles.termItem}>
                        3. If lost or damaged, please inform the association secretary immediately.
                    </Text>
                </View>

                <View style={styles.contactBox}>
                    <Text style={styles.contactTitle}>ISSUING AUTHORITY & RETURN ADDRESS:</Text>
                    <Text style={styles.contactText}>
                        All Kerala IT Dealers Association (AKITDA) - District Office
                    </Text>
                    <Text style={styles.contactText}>
                        Ernakulam, Kerala, India | Email: info@akitda.org
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
