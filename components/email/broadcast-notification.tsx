import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";
import { APP_NAME } from "@/lib/constants";

interface BroadcastNotificationEmailProps {
  subject: string;
  body: string;
}

export function BroadcastNotificationEmail({
  subject,
  body,
}: BroadcastNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}
        >
          <Heading>{subject}</Heading>
          <Hr />
          <Section>
            <Text style={{ whiteSpace: "pre-wrap" }}>{body}</Text>
          </Section>
          <Hr />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            This is a broadcast notification from {APP_NAME}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
