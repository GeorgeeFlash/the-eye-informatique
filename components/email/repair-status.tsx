import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Hr,
} from "@react-email/components"
import { APP_NAME } from "@/lib/constants"

interface RepairStatusEmailProps {
  customerName: string
  ticketId: string
  deviceDescription: string
  status: string
  note?: string
}

export function RepairStatusEmail({
  customerName,
  ticketId,
  deviceDescription,
  status,
  note,
}: RepairStatusEmailProps) {
  const statusLabels: Record<string, string> = {
    RECEIVED: "Reçu en atelier",
    DIAGNOSING: "En cours de diagnostic",
    AWAITING_PARTS: "En attente de pièces",
    IN_REPAIR: "En cours de réparation",
    REPAIRED: "Réparé",
    DELIVERED: "Livré",
    UNREPAIRABLE: "Non réparable",
  }

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <Heading>{APP_NAME} — Mise à jour réparation</Heading>
          <Text>Bonjour {customerName},</Text>
          <Text>
            Votre ticket de réparation <strong>#{ticketId}</strong> a été mis à jour.
          </Text>
          <Text>
            <strong>Appareil :</strong> {deviceDescription}
          </Text>
          <Text>
            <strong>Statut :</strong> {statusLabels[status] ?? status}
          </Text>
          {note && <Text><strong>Note :</strong> {note}</Text>}
          <Hr />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            {APP_NAME} · Service Après-Vente
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
