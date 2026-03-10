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

interface ContactSubmissionEmailProps {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export function ContactSubmissionEmail({
  name,
  email,
  phone,
  subject,
  message,
}: ContactSubmissionEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}
        >
          <Heading>{APP_NAME} — New Contact Submission</Heading>
          <Hr />
          <Section>
            <Text>
              <strong>From:</strong> {name}
            </Text>
            <Text>
              <strong>Email:</strong> {email}
            </Text>
            {phone && (
              <Text>
                <strong>Phone:</strong> {phone}
              </Text>
            )}
            <Text>
              <strong>Subject:</strong> {subject}
            </Text>
          </Section>
          <Hr />
          <Section>
            <Text style={{ whiteSpace: "pre-wrap" }}>{message}</Text>
          </Section>
          <Hr />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            This message was sent via the {APP_NAME} contact form.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
