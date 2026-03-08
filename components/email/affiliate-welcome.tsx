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

interface AffiliateWelcomeEmailProps {
  affiliateName: string
  commissionRate: number
}

export function AffiliateWelcomeEmail({
  affiliateName,
  commissionRate,
}: AffiliateWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <Heading>Bienvenue dans le programme affilié {APP_NAME} !</Heading>
          <Text>Bonjour {affiliateName},</Text>
          <Text>
            Votre candidature au programme affilié a été approuvée. Vous pouvez
            maintenant créer vos liens et commencer à gagner des commissions.
          </Text>
          <Text>
            <strong>Votre taux de commission :</strong> {commissionRate}%
          </Text>
          <Text>
            Connectez-vous à votre tableau de bord pour accéder à vos outils d&apos;affiliation.
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
