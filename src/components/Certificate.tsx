"use client";

import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Font } from "@react-pdf/renderer";
import { getFinancialYear } from "@/lib/financial-year";

Font.register({
    family: "FranklinGothicHeavy",
    src: typeof window !== "undefined" ? `${window.location.origin}/fonts/FranklinGothicHeavy.ttf` : "http://localhost:3000/fonts/FranklinGothicHeavy.ttf",
});

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#f1f5f9", // Sleek Light Ash background
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
        borderColor: "#1e3a8a", // Navy Blue main border
        zIndex: 0,
    },
    middleBorder: {
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        bottom: 16,
        borderWidth: 1,
        borderColor: "#d94f15", // Orange accent border
        zIndex: 0,
    },
    innerBorder: {
        position: "absolute",
        top: 19,
        left: 19,
        right: 19,
        bottom: 19,
        borderWidth: 0.5,
        borderColor: "#94a3b8", // Soft slate inline
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
        fontSize: 34,
        color: "#1e3a8a",
        fontFamily: "Times-Bold",
        letterSpacing: 3,
        textTransform: "uppercase",
        marginTop: 2,
    },
    certificateSubTitle: {
        fontSize: 11.5,
        color: "#0284c7",
        fontFamily: "Helvetica",
        letterSpacing: 6,
        textTransform: "uppercase",
        marginTop: 3,
        marginBottom: 2,
    },
    certifySection: {
        alignItems: "center",
        width: "100%",
    },
    certifyText: {
        fontSize: 13,
        color: "#1e3a8a",
        fontFamily: "Times-Roman",
        marginTop: 6,
        marginBottom: 6,
    },
    memberName: {
        fontSize: 34,
        color: "#1e3a8a",
        fontFamily: "Times-BoldItalic",
        textAlign: "center",
        width: "100%",
        marginVertical: 4,
    },
    nameDivider: {
        width: "70%",
        alignSelf: "center",
        height: 1,
        backgroundColor: "#cbd5e1",
        marginTop: 4,
        marginBottom: 12,
    },
    membershipBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e0f2fe",
        borderWidth: 1,
        borderColor: "#38bdf8",
        paddingVertical: 5,
        paddingHorizontal: 18,
        marginBottom: 12,
        borderRadius: 6,
    },
    membershipIdLabel: {
        fontSize: 11,
        color: "#1e3a8a",
        fontFamily: "Helvetica-Bold",
        marginRight: 6,
        letterSpacing: 0.5,
    },
    membershipIdValue: {
        fontSize: 11,
        color: "#d94f15",
        fontFamily: "Helvetica-Bold",
        letterSpacing: 0.5,
    },
    bodyTextContainer: {
        alignItems: "center",
        width: "100%",
    },
    bodyTextLine: {
        fontSize: 11,
        color: "#334155",
        fontFamily: "Times-Roman",
        textAlign: "center",
        marginVertical: 2,
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
        marginVertical: 6,
        position: "relative",
    },
    qrSection: {
        alignItems: "center",
        justifyContent: "center",
    },
    qrImage: {
        width: 52,
        height: 52,
        marginBottom: 2,
    },
    qrText: {
        fontSize: 8,
        color: "#000000",
        fontFamily: "Helvetica-Bold",
    },
    sealSection: {
        position: "absolute",
        right: 45,
        top: -12,
        alignItems: "center",
        justifyContent: "center",
    },
    sealImage: {
        width: 90,
        height: 90,
        objectFit: "contain",
    },
    signaturesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        width: "100%",
        paddingHorizontal: 10,
        paddingBottom: 5,
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

interface CertificateProps {
    memberName: string;
    membershipId: string;
    financialYear?: string;
    presidentSignatureUrl?: string;
    secretarySignatureUrl?: string;
    treasurerSignatureUrl?: string;
    officialSealUrl?: string;
}

export const MembershipCertificate = ({ 
    memberName, 
    membershipId, 
    financialYear = getFinancialYear().label,
    presidentSignatureUrl,
    secretarySignatureUrl,
    treasurerSignatureUrl,
    officialSealUrl
}: CertificateProps) => {
    const serialNumber = membershipId ? (membershipId.startsWith("AKEKM") ? membershipId.replace("AKEKM", "EKM") : membershipId) : "EKM007";

    return (
        <Document>
            <Page size="A4" orientation="portrait" style={styles.page}>
                {/* Multi-layered Ornate Borders */}
                <View style={styles.outerBorder} />
                <View style={styles.middleBorder} />
                <View style={styles.innerBorder} />

                {/* Top-Left Corner Ornament */}
                <Svg width="30" height="30" viewBox="0 0 30 30" style={{ position: "absolute", top: 11, left: 11, zIndex: 5 }}>
                    <Path d="M 0 0 L 25 0 L 25 3 L 3 3 L 3 25 L 0 25 Z" fill="#1e3a8a" />
                    <Path d="M 5 5 L 20 5 L 20 7 L 7 7 L 7 20 L 5 20 Z" fill="#d94f15" />
                    <Path d="M 9 9 L 14 9 L 14 14 L 9 14 Z" fill="#1e3a8a" />
                </Svg>

                {/* Top-Right Corner Ornament */}
                <Svg width="30" height="30" viewBox="0 0 30 30" style={{ position: "absolute", top: 11, right: 11, zIndex: 5 }}>
                    <Path d="M 30 0 L 5 0 L 5 3 L 27 3 L 27 25 L 30 25 Z" fill="#1e3a8a" />
                    <Path d="M 25 5 L 10 5 L 10 7 L 23 7 L 23 20 L 25 20 Z" fill="#d94f15" />
                    <Path d="M 21 9 L 16 9 L 16 14 L 21 14 Z" fill="#1e3a8a" />
                </Svg>

                {/* Bottom-Left Corner Ornament */}
                <Svg width="30" height="30" viewBox="0 0 30 30" style={{ position: "absolute", bottom: 11, left: 11, zIndex: 5 }}>
                    <Path d="M 0 30 L 25 30 L 25 27 L 3 27 L 3 5 L 0 5 Z" fill="#1e3a8a" />
                    <Path d="M 5 25 L 20 25 L 20 23 L 7 23 L 7 10 L 5 10 Z" fill="#d94f15" />
                    <Path d="M 9 21 L 14 21 L 14 16 L 9 16 Z" fill="#1e3a8a" />
                </Svg>

                {/* Bottom-Right Corner Ornament */}
                <Svg width="30" height="30" viewBox="0 0 30 30" style={{ position: "absolute", bottom: 11, right: 11, zIndex: 5 }}>
                    <Path d="M 30 30 L 5 30 L 5 27 L 27 27 L 27 5 L 30 5 Z" fill="#1e3a8a" />
                    <Path d="M 25 25 L 10 25 L 10 23 L 23 23 L 23 10 L 25 10 Z" fill="#d94f15" />
                    <Path d="M 21 21 L 16 21 L 16 16 L 21 16 Z" fill="#1e3a8a" />
                </Svg>

                {/* Watermark in center background */}
                <View style={styles.watermarkContainer}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src="/akitda-logo.png" style={styles.watermark} />
                </View>

                <View style={styles.contentContainer}>
                    {/* Header with logo, reg no, large bold title and district committee pill */}
                    <View style={styles.headerCol}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image src="/akitda-logo.png" style={styles.headerLogo} />
                        <Text style={styles.regNoSubtitle}>REG. No.ER366/04</Text>
                        <Text style={styles.headerTitleText}>All Kerala IT Dealers</Text>
                        <Text style={styles.headerTitleText}>Association</Text>
                        
                        <View style={styles.committeePill}>
                            <Text style={styles.committeeText}>Ernakulam District Committee</Text>
                        </View>
                    </View>

                    {/* Top Divider */}
                    <View style={styles.dividerLine} />

                    {/* Certificate Title Block */}
                    <View style={styles.certificateTitleBlock}>
                        <Text style={styles.certificateTitle}>CERTIFICATE</Text>
                        <Text style={styles.certificateSubTitle}>O F   R E G I S T R A T I O N</Text>
                    </View>

                    {/* Middle Divider */}
                    <View style={styles.dividerLine} />

                    {/* Certification statement */}
                    <View style={styles.certifySection}>
                        <Text style={styles.certifyText}>This is to certify that</Text>

                        {/* Member Firm Name */}
                        <Text style={styles.memberName}>{memberName}</Text>
                        <View style={styles.nameDivider} />

                        {/* Membership ID Box */}
                        <View style={styles.membershipBox}>
                            <Text style={styles.membershipIdLabel}>MEMBERSHIP ID:</Text>
                            <Text style={styles.membershipIdValue}>{membershipId}</Text>
                        </View>

                        {/* Body Text */}
                        <View style={styles.bodyTextContainer}>
                            <Text style={styles.bodyTextLine}>is a registered member of the</Text>
                            <Text style={[styles.bodyTextLine, styles.boldBlue, { fontSize: 11.5, marginVertical: 3 }]}>All Kerala IT Dealers Association</Text>
                            <Text style={styles.bodyTextLine}>and is hereby entitled to all rights and privileges as envisaged</Text>
                            <Text style={styles.bodyTextLine}>in the bylaws of the Association for the Year <Text style={styles.boldBlue}>{financialYear}</Text>.</Text>
                        </View>
                    </View>

                    {/* Centered QR Code with Official Seal on the Right Side */}
                    <View style={styles.qrAndSealRow}>
                        <View style={styles.qrSection}>
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            <Image 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${membershipId || "PENDING"}`} 
                                style={styles.qrImage} 
                            />
                            <Text style={styles.qrText}>S/N: {serialNumber}</Text>
                        </View>

                        {officialSealUrl && (
                            <View style={styles.sealSection}>
                                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                <Image src={officialSealUrl} style={styles.sealImage} />
                            </View>
                        )}
                    </View>

                    {/* Signatures Row */}
                    <View style={styles.signaturesRow}>
                        <View style={styles.signatureBlock}>
                            {presidentSignatureUrl ? (
                                /* eslint-disable-next-line jsx-a11y/alt-text */
                                <Image src={presidentSignatureUrl} style={styles.signatureImage} />
                            ) : (
                                <View style={styles.signaturePlaceholder} />
                            )}
                            <Text style={styles.signatureName}>Antony M.A.</Text>
                            <Text style={styles.signatureLabel}>PRESIDENT</Text>
                        </View>

                        <View style={styles.signatureBlock}>
                            {secretarySignatureUrl ? (
                                /* eslint-disable-next-line jsx-a11y/alt-text */
                                <Image src={secretarySignatureUrl} style={styles.signatureImage} />
                            ) : (
                                <View style={styles.signaturePlaceholder} />
                            )}
                            <Text style={styles.signatureName}>Navas T. Backer</Text>
                            <Text style={styles.signatureLabel}>SECRETARY</Text>
                        </View>

                        <View style={styles.signatureBlock}>
                            {treasurerSignatureUrl ? (
                                /* eslint-disable-next-line jsx-a11y/alt-text */
                                <Image src={treasurerSignatureUrl} style={styles.signatureImage} />
                            ) : (
                                <View style={styles.signaturePlaceholder} />
                            )}
                            <Text style={styles.signatureName}>Subhash T.S</Text>
                            <Text style={styles.signatureLabel}>TREASURER</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};




