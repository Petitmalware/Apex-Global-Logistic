import { EmailTemplateCategory } from "@prisma/client";

import { emailVariableKeys } from "@/features/emails/constants";

export type BuiltInClientEmailTemplate = {
  bodyHtml: string;
  category: EmailTemplateCategory;
  defaultVariables?: Record<string, string>;
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
  subject: string;
  variables: string[];
};

const standardVariables = [...emailVariableKeys];

export const builtInClientEmailTemplates: BuiltInClientEmailTemplate[] = [
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This message confirms that a live animal shipment has been registered with {{companyName}} for delivery to the address currently on file.</p>
      <p>The pet profile, health documentation, and transport registration have been reviewed by the operations team. Climate-conscious handling and route monitoring are assigned through the Apex tracking portal.</p>
      <p>Please review the delivery details below and reply with any correction or special delivery instruction before dispatch proceeds.</p>
      <ul>
        <li><strong>Pet:</strong> {{petName}}</li>
        <li><strong>Tracking number:</strong> {{trackingNumber}}</li>
        <li><strong>Delivery address:</strong> {{deliveryAddress}}</li>
        <li><strong>Estimated delivery:</strong> {{estimatedDeliveryDate}}</li>
      </ul>
      <p>Once your confirmation is recorded, Apex will continue with the scheduled transport workflow and update the tracking record as movement continues.</p>
    `,
    category: EmailTemplateCategory.PET,
    id: "pet-shipment-registration-notice",
    isActive: true,
    name: "Pet Shipment Registration Notice",
    slug: "pet-shipment-registration-notice",
    subject: "Live Animal Shipment Registered - Delivery Confirmation Required",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>Following the final review of {{petName}}'s travel arrangement, the logistics team recommends a temperature-controlled travel crate to support ventilation, comfort, and stable handling conditions during transit.</p>
      <p>Please review the available crate option below and reply with the option you approve for the shipment record.</p>
      <ul>
        <li><strong>Billing item:</strong> Temperature-controlled crate arrangement</li>
        <li><strong>Amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or ownership terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>After confirmation, Apex will update the crate assignment, attach the billing record where required, and continue the transport workflow.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$499.00 rental / $749.00 purchase",
      refundTerms:
        "Rental deposits may be refunded according to the signed crate return terms. Purchase options transfer ownership at delivery.",
    },
    id: "temperature-controlled-crate-arrangement",
    isActive: true,
    name: "Temperature-Controlled Crate Arrangement",
    slug: "temperature-controlled-crate-arrangement",
    subject: "Crate Arrangement Review for {{petName}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>Your shipment is currently marked for insurance documentation review while in transit. The operations record indicates that coverage documentation must be confirmed before the next route release is completed.</p>
      <p>Available documentation options can be recorded on the billing file as ordinary coverage, basic risk coverage, or all-risk coverage, depending on the selected shipment requirement.</p>
      <ul>
        <li><strong>Selected amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
        <li><strong>Current location:</strong> {{currentLocation}}</li>
      </ul>
      <p>Please reply with the preferred documentation option. Once confirmed, Apex will update the shipment file, attach the appropriate billing record, and continue the delivery workflow through the approved route.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$799.00 / $1,099.00 / $1,599.00",
      refundTerms:
        "Refundability depends on the selected coverage record and written invoice terms.",
    },
    id: "insurance-documentation-review",
    isActive: true,
    name: "Insurance Documentation Review",
    slug: "insurance-documentation-review",
    subject: "Insurance Documentation Review for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>We are contacting you regarding a temporary administrative hold recorded at {{currentLocation}}.</p>
      <p>During route review, the shipment file was marked for transit liability coverage confirmation. This hold verifies carrier responsibility, documentation, and continued transport authority before movement resumes.</p>
      <ul>
        <li><strong>Assessed amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Please confirm authorization so the compliance desk can update the record and request release of the administrative hold. Apex will document all approvals in the shipment history.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$2,500.00",
      refundTerms:
        "Any refundable portion must follow the written invoice and signed release terms.",
    },
    id: "transit-compliance-hold-review",
    isActive: true,
    name: "Transit Compliance Hold Review",
    slug: "transit-compliance-hold-review",
    subject: "Transit Compliance Hold Review for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This notice confirms that the shipment has reached {{currentLocation}} and is awaiting final clearance review before local delivery can proceed.</p>
      <p>The clearance desk requires verification of transport documentation, entry records, and release authorization. A temporary customs clearance deposit may be requested when required by the processing record.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Processing stage:</strong> Customs release authorization</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Once confirmation is recorded, the clearance desk will update the shipment file and release the delivery team for the final route stage.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$500.00",
      refundTerms: "Deposits are adjusted or refunded according to the written clearance terms.",
    },
    id: "customs-clearance-authorization",
    isActive: true,
    name: "Customs Clearance Authorization",
    slug: "customs-clearance-authorization",
    subject: "Customs Clearance Authorization for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>The shipment has reached a scheduled welfare inspection point at {{currentLocation}}. For long-distance live animal transportation, the operations team may require inspection clearance before the final route segment begins.</p>
      <p>This review helps document hydration, comfort, handling condition, and route readiness for {{petName}}.</p>
      <ul>
        <li><strong>Temporary compliance amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>After the inspection clearance is recorded, the delivery unit can continue toward the final destination. Apex will update the tracking timeline when the shipment is released from the inspection point.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$1,200.00",
      refundTerms: "Any refundable deposit must be documented on the official invoice.",
    },
    id: "transit-welfare-inspection-update",
    isActive: true,
    name: "Transit Welfare Inspection Update",
    slug: "transit-welfare-inspection-update",
    subject: "Transit Welfare Inspection Update for {{petName}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This is a follow-up notice regarding the open welfare clearance record for {{petName}} at {{currentLocation}}.</p>
      <p>The shipment remains in a temporary hold status until the required clearance record is resolved or alternative written instructions are approved by the operations desk. Apex is required to maintain care, documentation, and route accountability while the shipment remains in custody.</p>
      <ul>
        <li><strong>Open amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Please contact Apex support or reply with written instructions so the team can document the next approved action. All updates will be recorded in the shipment timeline.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$850.00",
      refundTerms: "Refundability depends on the written invoice and delivery release record.",
    },
    id: "welfare-clearance-follow-up",
    isActive: true,
    name: "Welfare Clearance Follow-Up",
    slug: "welfare-clearance-follow-up",
    subject: "Welfare Clearance Follow-Up for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>The tracking record for {{trackingNumber}} requires a permit and insurance review before final routing can be generated.</p>
      <p>This review is used when a live animal shipment has exceeded the standard hold window or when dispatch requires additional authorization before releasing the final route segment.</p>
      <ul>
        <li><strong>Required amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Please confirm the required permit or coverage option through the approved Apex billing workflow. Once recorded, dispatch will update the tracking status and release the shipment for continued movement where permitted.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$2,200.00",
      refundTerms: "Refundability must be stated on the official invoice or permit receipt.",
    },
    id: "tracking-permit-review",
    isActive: true,
    name: "Tracking Permit Review",
    slug: "tracking-permit-review",
    subject: "Tracking Permit Review for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>A documentation discrepancy has been recorded for {{petName}} during route compliance review.</p>
      <p>The Certificate of Veterinary Inspection record requires correction before the shipment can continue. The issue may include missing accreditation details, an incomplete stamp, or a microchip number that must be reconciled against the physical scan.</p>
      <ul>
        <li><strong>Documentation correction amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Once the corrected veterinary documentation is issued and attached to the shipment file, the route desk will update the tracking record and continue transport according to the approved compliance release.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$185.00",
      refundTerms: "Any reimbursement must be documented by the responsible party in writing.",
    },
    id: "veterinary-documentation-correction",
    isActive: true,
    name: "Veterinary Documentation Correction",
    slug: "veterinary-documentation-correction",
    subject: "Veterinary Documentation Review for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable veterinary clearance deposit for {{petName}} under shipment reference {{trackingNumber}}.</p>
      <p>The deposit is used only when a veterinarian clearance check is required before the shipment can continue or before final release can be approved.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Apex will attach any supporting clinic receipt or clearance record to the shipment file when the service is completed.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$100-$250",
      refundTerms:
        "Refunded if the vet check is not performed. If performed, the actual vet receipt is deducted.",
    },
    id: "refundable-veterinary-clearance-deposit",
    isActive: true,
    name: "Refundable Veterinary Clearance Deposit",
    slug: "refundable-veterinary-clearance-deposit",
    subject: "Refundable Veterinary Clearance Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice confirms a refundable fit-to-travel certificate deposit related to {{petName}} and shipment reference {{trackingNumber}}.</p>
      <p>The deposit supports review or issuance of a fit-to-travel certificate when required by the transport record, carrier, route, or handling authority.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Please review and approve through the official billing record so the operations desk can continue documentation processing.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$75-$200",
      refundTerms:
        "Refunded if the certificate is not required or issued. Non-refundable once issued by the vet.",
    },
    id: "refundable-fit-to-travel-certificate-deposit",
    isActive: true,
    name: "Refundable Fit-to-Travel Certificate Deposit",
    slug: "refundable-fit-to-travel-certificate-deposit",
    subject: "Fit-to-Travel Certificate Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable vaccination record processing deposit for {{petName}}.</p>
      <p>The deposit applies when a vaccination record must be reviewed, verified, or completed before travel clearance. If valid proof is accepted, the record will be updated and the billing adjustment will follow the refund terms below.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Please provide any available vaccination proof to Apex support so the documentation desk can complete verification.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$80-$180",
      refundTerms:
        "Refunded if valid vaccine proof is accepted. If administered, actual vet cost is deducted.",
    },
    id: "refundable-vaccination-record-processing-deposit",
    isActive: true,
    name: "Refundable Vaccination Record Processing Deposit",
    slug: "refundable-vaccination-record-processing-deposit",
    subject: "Vaccination Record Processing Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable crate assignment security deposit for {{petName}} and shipment reference {{trackingNumber}}.</p>
      <p>The deposit is used when a transport crate is assigned to the shipment and must be returned, cleared, or inspected after delivery.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Crate condition and return status will be recorded in the shipment history.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$150-$350",
      refundTerms: "Refunded after the crate is returned or cleared with no damage.",
    },
    id: "refundable-crate-assignment-security-deposit",
    isActive: true,
    name: "Refundable Crate Assignment Security Deposit",
    slug: "refundable-crate-assignment-security-deposit",
    subject: "Crate Assignment Security Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable crate safety equipment deposit for {{petName}}.</p>
      <p>The deposit covers assigned crate accessories such as bowls, water attachment, lining, labels, or other route-approved safety equipment.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Apex will record whether the items are used, returned, or cleared at delivery.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$50-$120",
      refundTerms:
        "Refunded if bowls, water attachment, lining, and accessories are returned or unused.",
    },
    id: "refundable-crate-safety-equipment-deposit",
    isActive: true,
    name: "Refundable Crate Safety Equipment Deposit",
    slug: "refundable-crate-safety-equipment-deposit",
    subject: "Crate Safety Equipment Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable feeding and care deposit for {{petName}} during shipment reference {{trackingNumber}}.</p>
      <p>The deposit applies only when feeding, hydration support, or handler care service is required during holding, transfer, or long-distance routing.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Please provide any feeding instructions, allergy notes, or schedule preferences before the service is used.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$40-$100",
      refundTerms:
        "Refunded if feeding service is not used. If used, food or care cost is deducted.",
    },
    id: "refundable-feeding-care-deposit",
    isActive: true,
    name: "Refundable Feeding & Care Deposit",
    slug: "refundable-feeding-care-deposit",
    subject: "Feeding and Care Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable climate monitoring deposit for {{petName}}.</p>
      <p>The deposit applies when a temperature sensor, crate monitor, or climate tracking device is assigned to the shipment.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>The device assignment and condition will be reflected in the shipment or pet transport record.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$50-$150",
      refundTerms: "Refunded if no sensor or device is used, or if the device is returned working.",
    },
    id: "refundable-climate-monitoring-deposit",
    isActive: true,
    name: "Refundable Climate Monitoring Deposit",
    slug: "refundable-climate-monitoring-deposit",
    subject: "Climate Monitoring Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable emergency care reserve for {{petName}} while shipment reference {{trackingNumber}} remains under Apex custody.</p>
      <p>The reserve is used only if verified emergency care, immediate welfare support, or urgent veterinary assistance becomes necessary during transit.</p>
      <ul>
        <li><strong>Reserve amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Any deduction must be supported by written proof or a service receipt.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.PET,
    defaultVariables: {
      amountDue: "$100-$300",
      refundTerms:
        "Refunded if no emergency care is needed. Any deduction must include proof or receipt.",
    },
    id: "refundable-emergency-care-reserve",
    isActive: true,
    name: "Refundable Emergency Care Reserve",
    slug: "refundable-emergency-care-reserve",
    subject: "Emergency Care Reserve for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable temporary holding deposit for shipment reference {{trackingNumber}}.</p>
      <p>The deposit applies only when a delay, rescheduling window, facility hold, or boarding period must be covered while the shipment remains under documented care.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Apex will record the hold reason and dates in the shipment timeline. Please confirm pickup, delivery, or release instructions so the operations team can minimize holding time wherever possible.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$75-$200 per day",
      refundTerms:
        "Refunded if pickup or shipment happens on schedule. Used only for documented delay costs.",
    },
    id: "refundable-temporary-holding-deposit",
    isActive: true,
    name: "Refundable Temporary Holding Deposit",
    slug: "refundable-temporary-holding-deposit",
    subject: "Temporary Holding Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice records a refundable handoff documentation deposit for shipment reference {{trackingNumber}}.</p>
      <p>The deposit applies when photo evidence, file documentation, delivery confirmation records, or recipient handoff materials are specifically requested for the shipment.</p>
      <ul>
        <li><strong>Deposit amount:</strong> {{amountDue}}</li>
        <li><strong>Refund or adjustment terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Apex recommends including basic handoff evidence at no extra charge whenever possible.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$25-$75",
      refundTerms:
        "Refunded if photo or file documentation is not produced; include it free when possible.",
    },
    id: "refundable-handoff-documentation-deposit",
    isActive: true,
    name: "Refundable Handoff Documentation Deposit",
    slug: "refundable-handoff-documentation-deposit",
    subject: "Handoff Documentation Deposit for {{trackingNumber}}",
    variables: standardVariables,
  },
  {
    bodyHtml: `
      <p>Dear {{recipientName}},</p>
      <p>This billing notice has been prepared by {{companyName}} for the service, deposit, adjustment, or compliance item listed below.</p>
      <ul>
        <li><strong>Shipment reference:</strong> {{trackingNumber}}</li>
        <li><strong>Amount:</strong> {{amountDue}}</li>
        <li><strong>Terms:</strong> {{refundTerms}}</li>
      </ul>
      <p>Please review the details and contact Apex support if any correction is required before payment or approval is completed.</p>
      <p><strong>Payment instruction:</strong> {{paymentInstructions}}</p>
    `,
    category: EmailTemplateCategory.BILLING,
    defaultVariables: {
      amountDue: "$0.00",
      refundTerms: "Enter the applicable billing, refund, or adjustment terms.",
    },
    id: "custom-billing-email",
    isActive: true,
    name: "Custom Billing Email",
    slug: "custom-billing-email",
    subject: "Billing Notice for {{trackingNumber}}",
    variables: standardVariables,
  },
];

export function getBuiltInClientEmailTemplates() {
  return builtInClientEmailTemplates.filter((template) => template.isActive);
}
