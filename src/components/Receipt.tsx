import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        color: '#1e40af', // Blue-800
        fontSize: 18,
        fontWeight: 'extrabold', // Helvetica-Bold
        textAlign: 'center',
        marginBottom: 2,
    },
    subtitle: {
        color: '#1e40af',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    districtLine: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    addressLine: {
        fontSize: 8,
        color: '#666',
        textAlign: 'center',
        marginBottom: 1,
    },
    badge: {
        marginTop: 8,
        backgroundColor: '#1d4ed8', // Blue-700
        color: 'white',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#1e40af',
        marginVertical: 15,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    label: {
        width: 100,
        color: '#666',
        fontSize: 10,
    },
    value: {
        flex: 1,
        fontSize: 11,
        fontWeight: 'bold',
    },
    valueBig: {
        flex: 1,
        fontSize: 12,
        fontWeight: 'bold',
    },
    receiptNoDateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    receiptNoLabel: {
        fontSize: 10,
        color: '#666',
    },
    receiptNoValue: {
        fontSize: 12,
        color: '#dc2626', // Red-600
        fontWeight: 'bold',
    },
    dateLabel: {
        fontSize: 10,
        color: '#666',
    },
    dateValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    amountText: {
        fontSize: 10,
        fontStyle: 'italic',
        color: '#444',
        marginLeft: 5,
        marginTop: 2,
    },
    paymentRow: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 8,
        marginTop: 20,
        alignItems: 'center',
    },
    checkbox: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: '#000',
        marginRight: 4,
    },
    checked: {
        backgroundColor: '#000',
    },
    paymentLabel: {
        marginRight: 16,
        fontSize: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerSection: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    signatureBlock: {
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#ccc',
        paddingTop: 4,
        width: 150,
    },
    watermark: {
        position: 'absolute',
        top: 200,
        left: 100,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        transform: 'rotate(-45deg)',
        fontSize: 80,
        color: '#999',
        zIndex: -1,
    },
});

interface ReceiptProps {
    receiptNumber: string;
    date: string;
    companyName: string;
    amount: number;
    paymentMode?: 'CASH' | 'UPI' | 'BANK'; // Optional prop for now
    treasurerSignatureUrl?: string;
    officialSealUrl?: string;
}

// Simple number to words converter (for common range)
function numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numStr = num.toString();
    if (numStr.length > 9) return 'Overflow';

    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str += (parseInt(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (parseInt(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (parseInt(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (parseInt(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (parseInt(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';

    return str + 'Rupees Only';
}

export const ReceiptDocument = ({ receiptNumber, date, companyName, amount, paymentMode = 'UPI', treasurerSignatureUrl, officialSealUrl }: ReceiptProps) => (
    <Document>
        <Page size="A5" style={{ ...styles.page, padding: 20 }}>
            {/* Watermark */}
            <View style={styles.watermark}>
                <Text>AKITDA</Text>
            </View>

            {/* Header */}
            <View style={styles.header}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src="/akitda-logo.png" style={{ width: 60, height: 60, marginBottom: 5 }} />
                <Text style={styles.title}>ALL KERALA IT DEALERS</Text>
                <Text style={styles.subtitle}>ASSOCIATION</Text>
                <Text style={styles.districtLine}>ERNAKULAM DISTRICT COMMITTEE</Text>
                <Text style={styles.addressLine}>1st Floor, Krishnakripa, KSN Menon Rd, Ravipuram, Perumanoor,</Text>
                <Text style={styles.addressLine}>Ernakulam - 682016</Text>
                <Text style={styles.addressLine}>Phone: 085470 26604 | REG. No.ER366/04</Text>
                <View style={styles.badge}>
                    <Text>OFFICIAL RECEIPT</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Receipt Details */}
            <View style={styles.receiptNoDateRow}>
                <View>
                    <Text style={styles.receiptNoLabel}>Receipt No:</Text>
                    <Text style={styles.receiptNoValue}>{receiptNumber}</Text>
                </View>
                <View>
                    <Text style={styles.dateLabel}>Date:</Text>
                    <Text style={styles.dateValue}>{date}</Text>
                </View>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Received from:</Text>
                <Text style={styles.valueBig}>{companyName.toUpperCase()}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>District/Unit:</Text>
                <Text style={styles.value}>Ernakulam</Text>
            </View>

            <View style={styles.amountRow}>
                <Text style={styles.label}>The sum of ₹:</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.valueBig}>{amount.toLocaleString('en-IN')}/- <Text style={styles.amountText}>({numberToWords(amount)})</Text></Text>
                </View>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Towards:</Text>
                <Text style={styles.value}>Membership Fees</Text>
            </View>

            {/* Payment Mode */}
            <View style={styles.paymentRow}>
                <Text style={{ fontSize: 10, marginRight: 10, color: '#666' }}>Payment Mode:</Text>

                <View style={styles.paymentLabel}>
                    <View style={[styles.checkbox, paymentMode === 'CASH' ? styles.checked : {}]} />
                    <Text>Cash</Text>
                </View>

                <View style={styles.paymentLabel}>
                    <View style={[styles.checkbox, paymentMode === 'UPI' ? styles.checked : {}]} />
                    <Text>UPI</Text>
                </View>

                <View style={styles.paymentLabel}>
                    <View style={[styles.checkbox, paymentMode === 'BANK' ? styles.checked : {}]} />
                    <Text>Cheque/Bank</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footerSection}>
                <View style={{ alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                    {officialSealUrl && (
                        /* eslint-disable-next-line jsx-a11y/alt-text */
                        <Image src={officialSealUrl} style={{ width: 50, height: 50, objectFit: 'contain', marginBottom: 2 }} />
                    )}
                    <Text style={{ fontSize: 8, color: '#999' }}>Thank you for your support!</Text>
                    <Text style={{ fontSize: 8, color: '#999' }}>Subject to realization of cheque.</Text>
                </View>
                <View style={styles.signatureBlock}>
                    {treasurerSignatureUrl ? (
                        /* eslint-disable-next-line jsx-a11y/alt-text */
                        <Image src={treasurerSignatureUrl} style={{ width: 90, height: 32, objectFit: 'contain', marginBottom: 2 }} />
                    ) : (
                        <View style={{ height: 32 }} />
                    )}
                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Authorized Signatory</Text>
                    <Text style={{ fontSize: 8, color: '#666' }}>Treasurer / AKITDA</Text>
                </View>
            </View>

        </Page>
    </Document>
);
