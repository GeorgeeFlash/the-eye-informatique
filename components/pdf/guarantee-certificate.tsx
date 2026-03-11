import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuaranteeCertificateProps {
  customerName: string;
  orderNumber: string;
  purchaseDate: string;
  items: Array<{
    productName: string;
    variant?: string;
    quantity: number;
  }>;
  locale: "en" | "fr";
}

// ---------------------------------------------------------------------------
// Bilingual content
// ---------------------------------------------------------------------------

const CONTENT = {
  en: {
    title: "GUARANTEE POLICY",
    subtitle: "Certificate of Guarantee",
    customerLabel: "Customer",
    orderLabel: "Order Number",
    dateLabel: "Purchase Date",
    itemsTitle: "Purchased Items",
    productCol: "Product",
    variantCol: "Details",
    qtyCol: "Qty",
    conditionsTitle: "Terms & Conditions",
    conditions: [
      "1. Money paid is not refundable under any circumstances.",
      "2. You have 48 hours from the date of purchase to verify your product and request an exchange for a product of equal value.",
      "3. After 48 hours and up to 3 months, repairs are provided free of charge. However, the customer is responsible for purchasing any damaged parts (screens, cases, chassis, or storage/memory damaged by viruses).",
      "4. Clients must back up their data before bringing in their device. The Eye Informatique assumes no responsibility for data loss.",
      "5. Clients are encouraged to install and maintain an antivirus solution on their devices.",
      "6. Swap or trade-in is allowed at any time, provided the device is in good condition.",
      "7. In case of any issue, please call our after-sales hotline (provided at the time of delivery) before visiting the store.",
    ],
    validityNotice:
      "This guarantee is valid for 3 months from the date of purchase.",
    expiresLabel: "Expires",
    companyName: "The Eye Informatique",
    companyTagline: "Your trusted tech shop in Cameroon",
    thankYou: "Thank you for your purchase!",
  },
  fr: {
    title: "POLITIQUE DE GARANTIE",
    subtitle: "Certificat de Garantie",
    customerLabel: "Client",
    orderLabel: "Numéro de commande",
    dateLabel: "Date d'achat",
    itemsTitle: "Articles achetés",
    productCol: "Produit",
    variantCol: "Détails",
    qtyCol: "Qté",
    conditionsTitle: "Termes & Conditions",
    conditions: [
      "1. L'argent versé n'est pas remboursable en aucune circonstance.",
      "2. Vous disposez de 48 heures à compter de la date d'achat pour vérifier votre produit et demander un échange contre un produit de valeur égale.",
      "3. Après 48 heures et jusqu'à 3 mois, les réparations sont gratuites. Cependant, le client est responsable de l'achat des pièces endommagées (écrans, coques, châssis, ou stockage/mémoire endommagés par des virus).",
      "4. Les clients doivent sauvegarder leurs données avant de confier leur appareil. The Eye Informatique décline toute responsabilité en cas de perte de données.",
      "5. Les clients sont encouragés à installer et maintenir un antivirus sur leurs appareils.",
      "6. L'échange ou le trade-in est autorisé à tout moment, à condition que l'appareil soit en bon état.",
      "7. En cas de problème, veuillez appeler notre service après-vente (numéro fourni lors de la livraison) avant de vous déplacer en boutique.",
    ],
    validityNotice:
      "Cette garantie est valable 3 mois à compter de la date d'achat.",
    expiresLabel: "Expire le",
    companyName: "The Eye Informatique",
    companyTagline: "Votre boutique tech de confiance au Cameroun",
    thankYou: "Merci pour votre achat !",
  },
} as const;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const PRIMARY = "#1a1a2e";
const ACCENT = "#e94560";
const LIGHT_BG = "#f5f5f5";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: PRIMARY,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: `2px solid ${ACCENT}`,
    paddingBottom: 12,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: LIGHT_BG,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontFamily: "Helvetica-Bold",
    width: 130,
    color: "#444",
  },
  infoValue: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    marginBottom: 8,
    marginTop: 12,
    borderBottom: `1px solid ${ACCENT}`,
    paddingBottom: 4,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    color: "#fff",
    padding: 6,
    borderRadius: 2,
  },
  tableHeaderText: {
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1px solid #e0e0e0",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1px solid #e0e0e0",
    backgroundColor: LIGHT_BG,
  },
  colProduct: { flex: 3 },
  colVariant: { flex: 2 },
  colQty: { width: 40, textAlign: "center" },
  condition: {
    marginBottom: 6,
    lineHeight: 1.5,
    fontSize: 9,
  },
  validityBox: {
    backgroundColor: LIGHT_BG,
    padding: 10,
    borderRadius: 4,
    marginTop: 16,
    borderLeft: `3px solid ${ACCENT}`,
  },
  validityText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  expiryText: {
    fontSize: 10,
    marginTop: 4,
    color: "#444",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#888",
    fontSize: 8,
    borderTop: "1px solid #e0e0e0",
    paddingTop: 8,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeExpiryDate(purchaseDate: string): string {
  const date = new Date(purchaseDate);
  date.setMonth(date.getMonth() + 3);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GuaranteeCertificate({
  customerName,
  orderNumber,
  purchaseDate,
  items,
  locale,
}: GuaranteeCertificateProps) {
  const t = CONTENT[locale];
  const expiryDate = computeExpiryDate(purchaseDate);
  const formattedPurchaseDate = new Date(purchaseDate).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-GB",
    { day: "2-digit", month: "long", year: "numeric" },
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not support alt */}
          <Image
            src={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/favicon-96x96.png`}
            style={styles.logo}
          />
          <View style={styles.headerText}>
            <Text style={styles.companyName}>{t.companyName}</Text>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>
        </View>

        {/* Order information */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.customerLabel}:</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.orderLabel}:</Text>
            <Text style={styles.infoValue}>{orderNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.dateLabel}:</Text>
            <Text style={styles.infoValue}>{formattedPurchaseDate}</Text>
          </View>
        </View>

        {/* Items table */}
        <Text style={styles.sectionTitle}>{t.itemsTitle}</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colProduct]}>
              {t.productCol}
            </Text>
            <Text style={[styles.tableHeaderText, styles.colVariant]}>
              {t.variantCol}
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>
              {t.qtyCol}
            </Text>
          </View>
          {items.map((item, i) => (
            <View
              key={`item-${i}`}
              style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colProduct}>{item.productName}</Text>
              <Text style={styles.colVariant}>{item.variant ?? "—"}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Policy conditions */}
        <Text style={styles.sectionTitle}>{t.conditionsTitle}</Text>
        {t.conditions.map((condition, i) => (
          <Text key={`cond-${i}`} style={styles.condition}>
            {condition}
          </Text>
        ))}

        {/* Validity notice */}
        <View style={styles.validityBox}>
          <Text style={styles.validityText}>{t.validityNotice}</Text>
          <Text style={styles.expiryText}>
            {t.expiresLabel}: {expiryDate}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{t.thankYou}</Text>
          <Text>
            {t.companyName} — {t.companyTagline}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
