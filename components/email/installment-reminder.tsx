import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Hr,
} from "@react-email/components"
import { formatCurrency, formatDate } from "@/lib/utils"
import { APP_NAME } from "@/lib/constants"

interface InstallmentReminderEmailProps {
  customerName: string
  orderId: string
  dueDate: Date
  amount: number
  installmentNumber: number
  totalInstallments: number
}

export function InstallmentReminderEmail({
  customerName,
  orderId,
  dueDate,
  amount,
  installmentNumber,
  totalInstallments,
}: InstallmentReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <Heading>{APP_NAME} — Rappel de versement</Heading>
          <Text>Bonjour {customerName},</Text>
          <Text>
            Votre prochain versement pour la commande <strong>#{orderId}</strong> est
            dû.
          </Text>
          <Text>
            <strong>Versement :</strong> {installmentNumber}/{totalInstallments}
          </Text>
          <Text>
            <strong>Montant :</strong> {formatCurrency(amount)}
          </Text>
          <Text>
            <strong>Date d&apos;échéance :</strong> {formatDate(dueDate)}
          </Text>
          <Hr />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            {APP_NAME} · Service Client
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
