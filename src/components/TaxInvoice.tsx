import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Register Fonts if needed, otherwise use Helvetica
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf' });

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 9,
        lineHeight: 1.3,
    },
    // Header Section
    headerContainer: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 0,
    },
    headerTop: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerLeft: {
        width: '70%',
    },
    headerRight: {
        width: '30%',
        textAlign: 'right',
        fontSize: 8,
    },
    orgName: {
        fontSize: 14,
        fontWeight: 'bold', // Helvetica-Bold
        marginBottom: 4,
    },
    orgAddress: {
        fontSize: 8,
    },
    // Customer & Invoice Details Section
    detailsContainer: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    customerDetails: {
        width: '60%',
        padding: 8,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    invoiceDetails: {
        width: '40%',
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    detailsLabel: {
        width: 70,
        fontWeight: 'bold',
    },
    invoiceRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        padding: 6,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // Table Section
    tableHeader: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#f0f0f0',
        borderTopWidth: 0, // connected to previous
        height: 25,
        alignItems: 'center',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#000',
        height: 300, // Fixed height for main content similar to image
    },
    colNo: { width: '5%', borderRightWidth: 1, borderColor: '#000', height: '100%', padding: 2, textAlign: 'center' },
    colItem: { width: '35%', borderRightWidth: 1, borderColor: '#000', height: '100%', padding: 2 },
    colHsn: { width: '10%', borderRightWidth: 1, borderColor: '#000', height: '100%', padding: 2, textAlign: 'center' },
    colQty: { width: '5%', borderRightWidth: 1, borderColor: '#000', height: '100%', padding: 2, textAlign: 'center' },
    colRate: { width: '10%', borderRightWidth: 1, borderColor: '#000', height: '100%', padding: 2, textAlign: 'right' },
    colTax: { width: '10%', borderRightWidth: 1, borderColor: '#000', height: '100%', padding: 2, textAlign: 'right' },
    colTotal: { width: '15%', height: '100%', padding: 2, textAlign: 'right' },

    // Footer / Totals
    totalsRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderTopWidth: 1, // Close table
        borderColor: '#000',
        padding: 4,
    },
    amountInWords: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#000',
        padding: 6,
        fontWeight: 'bold',
    },
    footerLayout: {
        flexDirection: 'row',
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#000',
    },
    footerLeft: {
        width: '60%',
        padding: 8,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    footerRight: {
        width: '40%',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    lastRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
    },
    signatory: {
        marginTop: 30,
        textAlign: 'center',
        fontSize: 8,
    },

    // Watermark/Logo
    watermarkContainer: {
        position: 'absolute',
        top: 250,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.1,
    }
});

interface TaxInvoiceProps {
    invoiceNo: string;
    date: string;
    customerName: string;
    customerGst: string;
    customerAddress: string;
    customerPhone?: string;
    items: {
        name: string;
        hsn: string;
        qty: number;
        rate: number;
        taxable: boolean;
    }[];
    treasurerSignatureUrl?: string;
    officialSealUrl?: string;
}

export const TaxInvoice = ({ invoiceNo, date, customerName, customerGst, customerAddress, customerPhone, items, treasurerSignatureUrl, officialSealUrl }: TaxInvoiceProps) => {
    // Calculations
    const taxableItems = items.filter(item => item.taxable);
    const nonTaxableItems = items.filter(item => !item.taxable);

    const totalTaxableValue = taxableItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const totalNonTaxableValue = nonTaxableItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);

    const sgstRate = 9;
    const cgstRate = 9;

    const sgstAmount = totalTaxableValue * (sgstRate / 100);
    const cgstAmount = totalTaxableValue * (cgstRate / 100);

    const totalAmount = totalTaxableValue + totalNonTaxableValue + sgstAmount + cgstAmount;
    const roundOff = Math.round(totalAmount) - totalAmount;
    const finalAmount = Math.round(totalAmount);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                <Image src="/akitda-logo.png" style={{ width: 45, height: 45, marginRight: 10 }} />
                                <View>
                                    <Text style={styles.orgName}>ALL KERALA IT DEALERS ASSOCIATION (AKITDA)</Text>
                                    <Text style={{ fontSize: 8, fontWeight: 'bold' }}>REG. No.ER366/04</Text>
                                </View>
                            </View>
                            <Text>1st Floor, Krishnakripa, KSN Menon Road, Ist Floor, Near South Over Bridge,</Text>
                            <Text>Ernakulam, Kerala - 682016. Ph: 85470 26604</Text>
                            <Text>E-mail: support@akitdaekm.com</Text>
                            <Text>www.akitda.in | www.akitda.co.in | www.akitda.org</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={{ fontWeight: 'bold' }}>GSTIN : 32AAFAA1650E1ZG</Text>
                            <Text style={{ marginTop: 10 }}>Print Copy Original</Text>
                            <Text style={{ marginTop: 10, fontWeight: 'bold' }}>All taxes are collected as per Goods</Text>
                            <Text style={{ fontWeight: 'bold' }}>and Services Tax (GST) ACT 2017</Text>
                        </View>
                    </View>
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.customerDetails}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 6, textDecoration: 'underline' }}>Customer Details</Text>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Name</Text>
                            <Text>:  {customerName}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Party GSTIN</Text>
                            <Text>:  {customerGst || "Unregistered"}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Phone</Text>
                            <Text>:  {customerPhone}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Address</Text>
                            <Text style={{ width: 220 }}>:  {customerAddress}</Text>
                        </View>
                    </View>
                    <View style={styles.invoiceDetails}>
                        <View style={styles.invoiceRow}>
                            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>Date : {date}</Text>
                        </View>
                        <View style={styles.invoiceRow}>
                            <Text style={{ fontWeight: 'bold', fontSize: 11 }}>Invoice No : {invoiceNo}</Text>
                        </View>
                        <View style={styles.invoiceRow}>
                            <Text>Bill Mode : CASH/BANK</Text>
                        </View>
                        <View style={styles.invoiceRow}>
                            <Text>Place Of Sale : Kerala - 32</Text>
                        </View>
                        <View style={[styles.invoiceRow, { borderBottomWidth: 0 }]}>
                            <Text>TaxType : GST</Text>
                        </View>
                    </View>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={styles.colNo}>No</Text>
                    <Text style={styles.colItem}>Item Name</Text>
                    <Text style={styles.colHsn}>HSN/SAC</Text>
                    <Text style={styles.colQty}>Qty</Text>
                    <Text style={styles.colRate}>Rate</Text>
                    <Text style={styles.colTax}>SGST</Text>
                    <Text style={styles.colTax}>CGST</Text>
                    <Text style={styles.colTotal}>Total</Text>
                </View>

                {/* Table Rows (Fixed Height Container) */}
                <View style={styles.tableRow}>
                    <View style={styles.colNo}>
                        <Text style={{ marginTop: 4 }}>1</Text>
                    </View>
                    <View style={styles.colItem}>
                        {items.map((item, i) => (
                            <Text key={i} style={{ marginTop: 4 }}>{item.name}</Text>
                        ))}
                    </View>
                    <View style={styles.colHsn}>
                        {items.map((item, i) => (
                            <Text key={i} style={{ marginTop: 4 }}>{item.hsn}</Text>
                        ))}
                    </View>
                    <View style={styles.colQty}>
                        {items.map((item, i) => (
                            <Text key={i} style={{ marginTop: 4 }}>{item.qty.toFixed(2)}</Text>
                        ))}
                    </View>
                    <View style={styles.colRate}>
                        {items.map((item, i) => (
                            <Text key={i} style={{ marginTop: 4 }}>{item.rate.toFixed(2)}</Text>
                        ))}
                    </View>
                    <View style={styles.colTax}>
                        {items.map((item, i) => (
                            <Text key={i} style={{ marginTop: 4 }}>
                                {item.taxable ? (item.qty * item.rate * 0.09).toFixed(2) : "0.00"}
                            </Text>
                        ))}
                    </View>
                    <View style={styles.colTax}>
                        {items.map((item, i) => (
                            <Text key={i} style={{ marginTop: 4 }}>
                                {item.taxable ? (item.qty * item.rate * 0.09).toFixed(2) : "0.00"}
                            </Text>
                        ))}
                    </View>
                    <View style={styles.colTotal}>
                        {items.map((item, i) => {
                            const itemTotal = item.qty * item.rate + (item.taxable ? (item.qty * item.rate * 0.18) : 0);
                            return <Text key={i} style={{ marginTop: 4 }}>{itemTotal.toFixed(2)}</Text>;
                        })}
                    </View>

                    {/* Watermark Logo inside Grid */}
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src="/akitda-logo.png" style={{ position: 'absolute', width: 200, height: 200, top: 40, left: 150, opacity: 0.05 }} />
                </View>

                {/* Totals Section */}
                {/* Round Off */}
                <View style={[styles.totalsRow, { borderTopWidth: 1, justifyContent: 'space-between' }]}>
                    <Text>Round Off: {roundOff.toFixed(2)}</Text>
                    <Text>{totalAmount.toFixed(2)}</Text>
                </View>

                {/* Footer Split */}
                <View style={styles.footerLayout}>
                    <View style={styles.footerLeft}>
                        <Text style={{ fontWeight: 'bold' }}>Tax Details:</Text>
                        <View style={{ flexDirection: 'row', marginTop: 4, marginBottom: 4 }}>
                            <Text style={{ width: 40, fontWeight: 'bold', fontSize: 8 }}>Tax%</Text>
                            <Text style={{ width: 50, fontWeight: 'bold', fontSize: 8 }}>Taxable</Text>
                            <Text style={{ width: 40, fontWeight: 'bold', fontSize: 8 }}>CGST</Text>
                            <Text style={{ width: 40, fontWeight: 'bold', fontSize: 8 }}>SGST</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={{ width: 40 }}>18%</Text>
                            <Text style={{ width: 50 }}>{totalTaxableValue.toFixed(2)}</Text>
                            <Text style={{ width: 40 }}>{cgstAmount.toFixed(2)}</Text>
                            <Text style={{ width: 40 }}>{sgstAmount.toFixed(2)}</Text>
                        </View>

                        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Bank Details:</Text>
                        <Text>ALL KERALA IT DEALERS ASSOCIATION</Text>
                        <Text>AC. NO. 0025073000002635</Text>
                        <Text>IFSCODE: SIBL0000026</Text>
                        <Text>SOUTH INDIAN BANK, MG ROAD, ERNAKULAM.</Text>
                    </View>
                    <View style={styles.footerRight}>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontWeight: 'bold' }}>Tax Amount :</Text>
                            <Text style={{ fontWeight: 'bold' }}>{(sgstAmount + cgstAmount).toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontWeight: 'bold' }}>CGST Total :</Text>
                            <Text style={{ fontWeight: 'bold' }}>{cgstAmount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontWeight: 'bold' }}>SGST Total :</Text>
                            <Text style={{ fontWeight: 'bold' }}>{sgstAmount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontWeight: 'bold' }}>IGST Total :</Text>
                            <Text style={{ fontWeight: 'bold' }}>0.00</Text>
                        </View>
                        <View style={[styles.lastRow, { borderBottomWidth: 0, marginTop: 4 }]}>
                            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>Bill Amount :</Text>
                            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{finalAmount.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Amount In Words & Slogan */}
                <View style={styles.amountInWords}>
                    <Text>Rupees {convertNumberToWords(finalAmount)} only...</Text>
                </View>
                <View style={[styles.amountInWords, { borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: 60, padding: 6 }]}>
                    <View style={{ justifyContent: 'flex-end' }}>
                        {officialSealUrl && (
                            /* eslint-disable-next-line jsx-a11y/alt-text */
                            <Image src={officialSealUrl} style={{ width: 50, height: 50, objectFit: 'contain', marginBottom: 2 }} />
                        )}
                        <Text style={{ fontSize: 8 }}>Narration: Membership Fee Received</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        {treasurerSignatureUrl ? (
                            /* eslint-disable-next-line jsx-a11y/alt-text */
                            <Image src={treasurerSignatureUrl} style={{ width: 90, height: 32, objectFit: 'contain', marginBottom: 2 }} />
                        ) : (
                            <View style={{ height: 32 }} />
                        )}
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Authorised Signatory</Text>
                        <Text style={{ fontSize: 7, color: '#666' }}>Treasurer / AKITDA</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};

// Helper for number to words
function convertNumberToWords(amount: number) {
    const num = Math.floor(amount);
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if (num === 0) return 'zero';

    const toWords = (n: number): string => {
        if (n < 20) return a[n];
        const digit = n % 10;
        if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[digit];
        if (n < 1000) return a[Math.floor(n / 100)] + 'hundred ' + (n % 100 == 0 ? '' : 'and ' + toWords(n % 100));
        return toWords(Math.floor(n / 1000)) + 'thousand ' + (n % 1000 != 0 ? ' ' + toWords(n % 1000) : '');
    };

    return toWords(num).toUpperCase() + " ONLY";
}
