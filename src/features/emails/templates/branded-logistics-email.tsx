import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type BrandedLogisticsEmailProps = {
  contentHtml: string;
  preheader?: string | null;
  shipment?: {
    destinationCity?: string | null;
    estimatedDeliveryDate?: string | null;
    originCity?: string | null;
    shipmentNumber?: string | null;
    shipmentStatus?: string | null;
  } | null;
  subject: string;
  supportEmail: string;
  supportPhone: string;
  trackingUrl?: string | null;
};

const colors = {
  accent: "#f59e0b",
  background: "#f5f7fb",
  border: "#dce3ee",
  ink: "#111827",
  muted: "#64748b",
  navy: "#10243f",
  panel: "#ffffff",
};

export function BrandedLogisticsEmail({
  contentHtml,
  preheader,
  shipment,
  subject,
  supportEmail,
  supportPhone,
  trackingUrl,
}: BrandedLogisticsEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preheader || subject}</Preview>
      <Body
        style={{
          backgroundColor: colors.background,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          margin: 0,
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            backgroundColor: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: "10px",
            margin: "0 auto",
            maxWidth: "640px",
            overflow: "hidden",
          }}
        >
          <Section
            style={{
              backgroundColor: colors.navy,
              padding: "28px 32px",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0",
                margin: 0,
              }}
            >
              AG
            </Text>
            <Heading
              as="h1"
              style={{
                color: "#ffffff",
                fontSize: "24px",
                lineHeight: "32px",
                margin: "10px 0 0",
              }}
            >
              Apex Global Logistics
            </Heading>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: "22px",
                margin: "8px 0 0",
              }}
            >
              Premium logistics updates for parcel, pet, freight, and support operations.
            </Text>
          </Section>

          <Section style={{ padding: "28px 32px" }}>
            <Heading
              as="h2"
              style={{
                color: colors.ink,
                fontSize: "20px",
                lineHeight: "28px",
                margin: "0 0 18px",
              }}
            >
              {subject}
            </Heading>
            <div
              dangerouslySetInnerHTML={{ __html: contentHtml }}
              style={{
                color: colors.ink,
                fontSize: "15px",
                lineHeight: "25px",
              }}
            />

            {shipment ? (
              <Section
                style={{
                  backgroundColor: "#f8fafc",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  marginTop: "24px",
                  padding: "18px",
                }}
              >
                <Text
                  style={{
                    color: colors.navy,
                    fontSize: "13px",
                    fontWeight: 700,
                    margin: "0 0 10px",
                    textTransform: "uppercase",
                  }}
                >
                  Shipment information
                </Text>
                <Text style={{ color: colors.ink, fontSize: "14px", margin: "0 0 6px" }}>
                  Tracking: {shipment.shipmentNumber || "Not assigned"}
                </Text>
                <Text style={{ color: colors.ink, fontSize: "14px", margin: "0 0 6px" }}>
                  Status: {shipment.shipmentStatus || "Pending"}
                </Text>
                <Text style={{ color: colors.ink, fontSize: "14px", margin: "0 0 6px" }}>
                  Route: {shipment.originCity || "Origin"} to{" "}
                  {shipment.destinationCity || "Destination"}
                </Text>
                {shipment.estimatedDeliveryDate ? (
                  <Text style={{ color: colors.ink, fontSize: "14px", margin: 0 }}>
                    Estimated delivery: {shipment.estimatedDeliveryDate}
                  </Text>
                ) : null}
              </Section>
            ) : null}

            {trackingUrl ? (
              <Button
                href={trackingUrl}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: "6px",
                  color: "#111827",
                  display: "inline-block",
                  fontSize: "14px",
                  fontWeight: 700,
                  marginTop: "22px",
                  padding: "12px 18px",
                  textDecoration: "none",
                }}
              >
                Track shipment
              </Button>
            ) : null}
          </Section>

          <Hr style={{ borderColor: colors.border, margin: 0 }} />

          <Section style={{ padding: "22px 32px" }}>
            <Text
              style={{
                color: colors.ink,
                fontSize: "14px",
                fontWeight: 700,
                margin: "0 0 8px",
              }}
            >
              Need help?
            </Text>
            <Text style={{ color: colors.muted, fontSize: "13px", lineHeight: "21px", margin: 0 }}>
              Contact Apex Global Logistics support at {supportEmail} or {supportPhone}. Our team is
              available for shipment, billing, freight, and pet transportation questions.
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#f8fafc",
              padding: "18px 32px 24px",
            }}
          >
            <Text style={{ color: colors.muted, fontSize: "12px", lineHeight: "19px", margin: 0 }}>
              This message may contain confidential logistics, shipment, customer, or billing
              information. If you received it in error, please delete it and contact Apex Global
              Logistics support.
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: "12px",
                lineHeight: "19px",
                margin: "12px 0 0",
              }}
            >
              © {new Date().getFullYear()} Apex Global Logistics. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
