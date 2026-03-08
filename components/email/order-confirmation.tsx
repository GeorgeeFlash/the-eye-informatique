import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components"
import { formatCurrency } from "@/lib/utils"
import { APP_NAME } from "@/lib/constants"

interface OrderConfirmationEmailProps {
  customerName: string
  orderId: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  deliveryMethod: string
}

export function OrderConfirmationEmail({
  customerName,
  orderId,
  items,
  total,
  deliveryMethod,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <Heading>{APP_NAME}</Heading>
          <Text>Bonjour {customerName},</Text>
          <Text>
            Votre commande <strong>#{orderId}</strong> a été confirmée.
          </Text>
          <Section>
            {items.map((item, i) => (
              <Text key={i}>
                {item.quantity}× {item.name} — {formatCurrency(item.price * item.quantity)}
              </Text>
            ))}
          </Section>
          <Hr />
          <Text>
            <strong>Total :</strong> {formatCurrency(total)}
          </Text>
          <Text>
            <strong>Mode de livraison :</strong> {deliveryMethod}
          </Text>
          <Hr />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            Merci de votre confiance — {APP_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
