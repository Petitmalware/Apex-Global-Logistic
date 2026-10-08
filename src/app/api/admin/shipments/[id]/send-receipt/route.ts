import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission, hasRole } from "@/lib/auth/rbac";
import { getShipmentForUser } from "@/features/shipments/queries/shipment.queries";
import { getCompanyProfile } from "@/features/settings/queries/company-profile.queries";
import { sendEmailWithConfiguredProvider } from "@/features/emails/services/email-provider.service";
import { buildThermalReceiptHtml } from "@/features/shipments/services/thermal-receipt-email.service";
import { prisma } from "@/lib/db";
import { EmailLogStatus, EmailTemplateCategory } from "@prisma/client";
import { kilogramsToPoundsString } from "@/lib/measurements";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SendReceiptPayload = {
  recipientChoice: "sender" | "receiver" | "both";
  senderEmail?: string;
  receiverEmail?: string;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentSessionUser();
    if (
      !user ||
      (!hasRole(user, [AUTH_ROLES.ADMIN, AUTH_ROLES.AGENT]) &&
        !hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE))
    ) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Shipment ID required", success: false }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<SendReceiptPayload>;
    const recipientChoice = body.recipientChoice || "both";

    // Fetch full shipment details
    const shipment = await getShipmentForUser(id, user);
    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found", success: false }, { status: 404 });
    }

    const profile = await getCompanyProfile();

    // Resolve Sender and Receiver emails
    const resolvedSenderEmail =
      body.senderEmail?.trim() ||
      shipment.officeDetails?.shipperEmail?.trim() ||
      (shipment.origin?.name?.includes("@") ? shipment.origin.name : null) ||
      null;

    const resolvedReceiverEmail =
      body.receiverEmail?.trim() ||
      shipment.recipientEmail?.trim() ||
      shipment.manualRecipient?.email?.trim() ||
      null;

    const targets: Array<{ email: string; name: string; role: "Sender" | "Receiver" }> = [];

    if (recipientChoice === "sender" || recipientChoice === "both") {
      if (resolvedSenderEmail) {
        targets.push({
          email: resolvedSenderEmail,
          name: shipment.origin.name || "Sender",
          role: "Sender",
        });
      } else if (recipientChoice === "sender") {
        return NextResponse.json(
          {
            error: "Sender email is missing. Please provide a valid sender email address.",
            success: false,
          },
          { status: 400 }
        );
      }
    }

    if (recipientChoice === "receiver" || recipientChoice === "both") {
      if (resolvedReceiverEmail) {
        targets.push({
          email: resolvedReceiverEmail,
          name: shipment.recipientName || shipment.destination.name || "Receiver",
          role: "Receiver",
        });
      } else if (recipientChoice === "receiver") {
        return NextResponse.json(
          {
            error: "Receiver email is missing. Please provide a valid receiver email address.",
            success: false,
          },
          { status: 400 }
        );
      }
    }

    if (targets.length === 0) {
      return NextResponse.json(
        {
          error:
            "No recipient email addresses found for this shipment. Please enter sender and/or receiver email addresses.",
          success: false,
        },
        { status: 400 }
      );
    }

    // Build thermal receipt email HTML
    const companyAddress = [
      profile.addressLine1,
      profile.addressLine2,
      [profile.city, profile.state, profile.postalCode].filter(Boolean).join(", "),
      profile.country,
    ].filter((s): s is string => Boolean(s));

    const totalWeightLb = shipment.weightSummary?.chargeableWeightKg
      ? kilogramsToPoundsString(shipment.weightSummary.chargeableWeightKg)
      : null;

    const html = buildThermalReceiptHtml({
      companyAddress: companyAddress.length > 0 ? companyAddress : undefined,
      companyEmail: profile.email || siteConfig.emails.support,
      companyName: profile.legalName || siteConfig.name,
      companyPhone: profile.phone || siteConfig.phone,
      createdAt: shipment.createdAt,
      currentLocation: shipment.timeline[0]?.currentLocation,
      destination: {
        city: shipment.destination.city,
        countryCode: shipment.destination.countryCode,
        email: resolvedReceiverEmail,
        line1: shipment.destination.line1,
        line2: shipment.destination.line2,
        name: shipment.recipientName || shipment.destination.name,
        phone: shipment.manualRecipient?.phone,
        postalCode: shipment.destination.postalCode,
        state: shipment.destination.state,
      },
      notes: shipment.officeDetails?.comments ?? shipment.notes,
      origin: {
        city: shipment.origin.city,
        countryCode: shipment.origin.countryCode,
        email: resolvedSenderEmail,
        line1: shipment.origin.line1,
        line2: shipment.origin.line2,
        name: shipment.origin.name,
        phone: shipment.officeDetails?.shipperPhone,
        postalCode: shipment.origin.postalCode,
        state: shipment.origin.state,
      },
      packageCount: shipment.packageCount,
      packages: shipment.packages.map((pkg) => ({
        description: pkg.description,
        packageNumber: pkg.packageNumber,
        type: pkg.type,
        weightLb: pkg.weightKg ? kilogramsToPoundsString(pkg.weightKg) : null,
      })),
      referenceNumber: shipment.referenceNumber,
      serviceLevel: shipment.serviceLevel,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      totalWeightLb,
      updatedAt: shipment.updatedAt,
    });

    const subject = `Official Shipping Receipt: ${shipment.shipmentNumber} – Apex Global Logistics`;
    const text = `Your official thermal shipping receipt for ${shipment.shipmentNumber} is ready. Status: ${shipment.status}. View real-time tracking at: ${siteConfig.url}/tracking?q=${encodeURIComponent(shipment.shipmentNumber)}`;

    const successfulDeliveries: string[] = [];
    const errors: string[] = [];

    for (const target of targets) {
      try {
        const sendResult = await sendEmailWithConfiguredProvider({
          html,
          recipientEmail: target.email,
          recipientName: target.name,
          senderName: "Apex Global Logistics Operations",
          subject,
          text,
        });

        successfulDeliveries.push(`${target.role} (${target.email})`);

        // Record in email audit log
        try {
          await prisma.emailLog.create({
            data: {
              bodyHtml: html,
              bodyText: text,
              category: EmailTemplateCategory.SHIPMENT,
              metadata: {
                recipientChoice,
                recipientRole: target.role,
                shipmentId: shipment.id,
                shipmentNumber: shipment.shipmentNumber,
                source: "shipment-thermal-receipt-email",
              },
              organizationId: user.organizationId ?? undefined,
              provider: sendResult.provider,
              providerMessageId: sendResult.messageId,
              recipientEmail: target.email,
              recipientName: target.name,
              sentAt: new Date(),
              sentById: user.id,
              shipmentId: shipment.id,
              status: EmailLogStatus.SENT,
              subject,
            },
          });
        } catch (logErr) {
          console.warn("[Thermal Receipt] Could not create emailLog:", logErr);
        }
      } catch (sendErr) {
        console.error(`[Thermal Receipt] Failed to send email to ${target.email}:`, sendErr);
        errors.push(`${target.role} (${target.email}): ${sendErr instanceof Error ? sendErr.message : "Unknown error"}`);
      }
    }

    if (successfulDeliveries.length === 0) {
      return NextResponse.json(
        {
          error: `Failed to deliver receipt email: ${errors.join("; ")}`,
          success: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Thermal shipping receipt successfully sent to: ${successfulDeliveries.join(", ")}`,
      sentTo: successfulDeliveries,
      success: true,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Send Receipt] Unhandled route error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}
