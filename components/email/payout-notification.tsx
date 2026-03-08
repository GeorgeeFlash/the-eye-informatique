import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Hr,
} from "@react-email/components"
import { formatCurrency } from "@/lib/utils"
import { APP_NAME } from "@/lib/constants"

interface PayoutNotificationEmailProps {
  affiliateName: string
  amount: number
  payoutId: string
  method: string
}

export function PayoutNotificationEmail({
  affiliateName,
  amount,
  payoutId,
  method,
}: PayoutNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <Heading>{APP_NAME} — Paiement de commission</Heading>
          <Text>Bonjour {affiliateName},</Text>
          <Text>
            Votre paiement de commission <strong>#{payoutId}</strong> a été traité.
          </Text>
          <Text>
            <strong>Montant :</strong> {formatCurrency(amount)}
          </Text>
          <Text>
            <strong>Méthode :</strong> {method}
          </Text>
          <Hr />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            {APP_NAME} · Programme Affilié
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
