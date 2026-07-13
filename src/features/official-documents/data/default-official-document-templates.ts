import type { OfficialDocumentTemplate } from "@/features/official-documents/types/official-document.types";

export const officialDocumentCategories = [
  "Live animal transport",
  "Billing notice",
  "Compliance clearance",
  "Customs clearance",
  "Insurance documentation",
  "Veterinary documentation",
  "General authorization",
] as const;

export const standardOfficialDocumentVariables = [
  "companyName",
  "recipientName",
  "petName",
  "trackingNumber",
  "deliveryAddress",
  "currentLocation",
  "estimatedDeliveryDate",
  "documentDate",
  "amountDue",
  "refundTerms",
  "paymentInstructions",
  "supportEmail",
  "supportPhone",
  "website",
];

export const defaultOfficialDocumentTemplates: OfficialDocumentTemplate[] = [
  {
    amountLabel: "No payment due",
    body: `Dear {{recipientName}},

This notice confirms that a live animal shipment has been registered with {{companyName}} for delivery to the recipient address on file.

The pet profile, health documentation, and transport registration have been reviewed by the operations desk. The assigned containment and handling plan are recorded for climate-conscious live animal transit, with route monitoring through the Apex tracking portal.

Please review the delivery details below and confirm that the address, contact details, and any handling instructions are accurate before dispatch proceeds.

Tracking number: {{trackingNumber}}
Delivery address: {{deliveryAddress}}
Estimated delivery: {{estimatedDeliveryDate}}

Reply to the operations team with any corrections or special delivery instructions. Once confirmed, Apex will continue with the scheduled handoff and provide updates through the tracking record.`,
    category: "Live animal transport",
    description: "Initial agency registration notice for a pet shipment.",
    id: "live-animal-shipment-registration",
    isActive: true,
    paymentInstructions: "No payment request is included in this registration notice.",
    refundTerms: "Not applicable.",
    slug: "live-animal-shipment-registration",
    subject: "Live Animal Shipment Registered - Delivery Confirmation Required",
    title: "Live Animal Shipment Registration Notice",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$499.00 rental / $749.00 purchase",
    amountLabel: "Temperature-controlled crate options",
    body: `Dear {{recipientName}},

Following the final review of {{petName}}'s travel arrangement, the logistics team recommends a temperature-controlled travel crate to support comfort, ventilation, and stable handling conditions during transit.

Available options:

Rental option: {{amountDue}}
Refund terms: {{refundTerms}}

Purchase option: enter the approved purchase amount if the recipient prefers to retain the crate after delivery.

Kindly confirm the preferred crate option so Apex can finalize the crate assignment and update the shipment record. If you have questions about handling, crate specifications, or delivery timing, contact the operations desk before dispatch continues.`,
    category: "Billing notice",
    description: "Editable crate rental or purchase authorization document.",
    id: "climate-controlled-crate-arrangement",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or payment link only.",
    refundTerms: "Rental deposits may be refunded according to the signed crate return terms.",
    slug: "climate-controlled-crate-arrangement",
    subject: "Crate Arrangement Review for {{petName}}",
    title: "Temperature-Controlled Crate Arrangement",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$799.00 / $1,099.00 / $1,599.00",
    amountLabel: "Insurance documentation options",
    body: `Dear {{recipientName}},

Your shipment is currently marked for insurance documentation review while in transit. The operations record indicates that coverage documentation must be confirmed before the next route release is completed.

Available documentation options may include:

Ordinary coverage: standard transit risk documentation and required certificate handling.
Basic risk coverage: enhanced handling documentation, accommodation coverage, and route support.
All risk coverage: priority documentation, expanded accommodation and handling coverage, and additional incident coverage.

Selected amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please confirm the preferred documentation option. Once confirmed, Apex will update the shipment file, attach the appropriate billing record, and continue the delivery workflow through the approved route.`,
    category: "Insurance documentation",
    description: "Professional insurance documentation request without pressure language.",
    id: "insurance-documentation-review",
    isActive: true,
    paymentInstructions: "Payment or deposit requests must be issued through an Apex invoice.",
    refundTerms: "Refundability depends on the selected coverage record and written invoice terms.",
    slug: "insurance-documentation-review",
    subject: "Insurance Documentation Review for {{trackingNumber}}",
    title: "Insurance Documentation Review",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$2,500.00",
    amountLabel: "Transit liability coverage fee",
    body: `Dear {{recipientName}},

We are contacting you regarding a temporary administrative hold recorded at {{currentLocation}}.

During route review, the shipment file was marked for transit liability coverage confirmation. This hold is used to verify that carrier responsibility, documentation, and continued transport authority are properly recorded before the shipment resumes movement.

Assessed amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please confirm authorization so the compliance desk can update the record and request release of the administrative hold. Apex will document all approvals in the shipment history and continue routing once the hold is cleared.`,
    category: "Compliance clearance",
    description: "Transit compliance hold and liability coverage authorization.",
    id: "transit-compliance-hold",
    isActive: true,
    paymentInstructions: "Use the approved Apex billing channel listed on the invoice.",
    refundTerms: "Any refundable portion must follow the written invoice and signed release terms.",
    slug: "transit-compliance-hold",
    subject: "Transit Compliance Hold Review for {{trackingNumber}}",
    title: "Transit Compliance Hold Notice",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$500.00",
    amountLabel: "Customs clearance deposit",
    body: `Dear {{recipientName}},

This notice confirms that the shipment has reached {{currentLocation}} and is awaiting final clearance review before local delivery can proceed.

The clearance desk requires verification of transport documentation, entry records, and release authorization. A temporary customs clearance deposit may be requested when required by the processing record.

Deposit amount: {{amountDue}}
Processing stage: Customs release authorization
Refund or adjustment terms: {{refundTerms}}

Once confirmation is recorded, the clearance desk will update the shipment file and release the delivery team for the final route stage.`,
    category: "Customs clearance",
    description: "Customs clearance deposit and release authorization notice.",
    id: "customs-clearance-authorization",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or clearance payment instruction only.",
    refundTerms: "Deposits are adjusted or refunded according to the written clearance terms.",
    slug: "customs-clearance-authorization",
    subject: "Customs Clearance Authorization for {{trackingNumber}}",
    title: "Customs Clearance Authorization",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$1,200.00",
    amountLabel: "Transit welfare inspection deposit",
    body: `Dear {{recipientName}},

The shipment has reached a scheduled welfare inspection point at {{currentLocation}}. For long-distance live animal transportation, the operations team may require inspection clearance before the final route segment begins.

This review helps document hydration, comfort, handling condition, and route readiness for {{petName}}.

Temporary compliance amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

After the inspection clearance is recorded, the delivery unit can continue toward the final destination. Apex will update the tracking timeline when the shipment is released from the inspection point.`,
    category: "Live animal transport",
    description: "Welfare inspection clearance document for long-distance pet transport.",
    id: "transit-welfare-inspection",
    isActive: true,
    paymentInstructions: "Use only the approved Apex invoice or payment portal.",
    refundTerms: "Any refundable deposit must be documented on the official invoice.",
    slug: "transit-welfare-inspection",
    subject: "Transit Welfare Inspection Update for {{petName}}",
    title: "Transit Welfare Inspection Clearance",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$850.00",
    amountLabel: "Welfare clearance balance",
    body: `Dear {{recipientName}},

This is a follow-up notice regarding the open welfare clearance record for {{petName}} at {{currentLocation}}.

The shipment remains in a temporary hold status until the required clearance record is resolved or alternative written instructions are approved by the operations desk. Apex is required to maintain care, documentation, and route accountability while the shipment remains in custody.

Open amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please contact Apex support or reply with written instructions so the team can document the next approved action. All updates will be recorded in the shipment timeline.`,
    category: "Compliance clearance",
    description: "Neutral follow-up for unresolved welfare clearance records.",
    id: "welfare-clearance-follow-up",
    isActive: true,
    paymentInstructions: "Any payment must be completed through an approved Apex invoice.",
    refundTerms: "Refundability depends on the written invoice and delivery release record.",
    slug: "welfare-clearance-follow-up",
    subject: "Welfare Clearance Follow-Up for {{trackingNumber}}",
    title: "Welfare Clearance Follow-Up",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$2,200.00",
    amountLabel: "Transit permit or insurance review",
    body: `Dear {{recipientName}},

The tracking record for {{trackingNumber}} requires a permit and insurance review before final routing can be generated.

This review is used when a live animal shipment has exceeded the standard hold window or when dispatch requires additional authorization before releasing the final route segment.

Required amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please confirm the required permit or coverage option through the approved Apex billing workflow. Once recorded, dispatch will update the tracking status and release the shipment for continued movement where permitted.`,
    category: "Insurance documentation",
    description: "Tracking permit and insurance review document.",
    id: "tracking-permit-review",
    isActive: true,
    paymentInstructions:
      "Use the approved Apex billing channel. Do not send payment to personal accounts.",
    refundTerms: "Refundability must be stated on the official invoice or permit receipt.",
    slug: "tracking-permit-review",
    subject: "Tracking Permit Review for {{trackingNumber}}",
    title: "Tracking Permit and Insurance Review",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$185.00",
    amountLabel: "Veterinary documentation correction",
    body: `Dear {{recipientName}},

A documentation discrepancy has been recorded for {{petName}} during route compliance review.

The Certificate of Veterinary Inspection record requires correction before the shipment can continue. The issue may include missing accreditation details, an incomplete stamp, or a microchip number that must be reconciled against the physical scan.

Documentation correction amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Once the corrected veterinary documentation is issued and attached to the shipment file, the route desk will update the tracking record and continue transport according to the approved compliance release.`,
    category: "Veterinary documentation",
    description: "CVI discrepancy and veterinary documentation correction notice.",
    id: "cvi-discrepancy-correction",
    isActive: true,
    paymentInstructions:
      "Use the approved clinic or Apex billing instruction shown on the official invoice.",
    refundTerms: "Any reimbursement must be documented by the responsible party in writing.",
    slug: "cvi-discrepancy-correction",
    subject: "Veterinary Documentation Review for {{trackingNumber}}",
    title: "Certificate of Veterinary Inspection Review",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$100-$250",
    amountLabel: "Refundable Veterinary Clearance Deposit",
    body: `Dear {{recipientName}},

This official billing form records a refundable veterinary clearance deposit for {{petName}} under shipment reference {{trackingNumber}}.

The deposit is used only when a veterinarian clearance check is required before the shipment can continue or before final release can be approved. Apex will attach any supporting clinic receipt or clearance record to the shipment file when the service is completed.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please review the billing record and contact Apex support if any pet, shipment, or recipient information requires correction before approval.`,
    category: "Veterinary documentation",
    description: "Refundable deposit for a pending veterinary clearance check.",
    id: "refundable-veterinary-clearance-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms:
      "Refunded if the vet check is not performed. If performed, the actual vet receipt is deducted.",
    slug: "refundable-veterinary-clearance-deposit",
    subject: "Refundable Veterinary Clearance Deposit for {{trackingNumber}}",
    title: "Refundable Veterinary Clearance Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$75-$200",
    amountLabel: "Refundable Fit-to-Travel Certificate Deposit",
    body: `Dear {{recipientName}},

This document confirms a refundable fit-to-travel certificate deposit related to {{petName}} and shipment reference {{trackingNumber}}.

The deposit supports review or issuance of a fit-to-travel certificate when required by the transport record, carrier, route, or handling authority. Apex will update the shipment file once the certificate status is confirmed.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please review and approve through the official billing record so the operations desk can continue documentation processing.`,
    category: "Veterinary documentation",
    description: "Refundable deposit for a health or fit-to-travel certificate.",
    id: "refundable-fit-to-travel-certificate-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms:
      "Refunded if the certificate is not required or issued. Non-refundable once issued by the vet.",
    slug: "refundable-fit-to-travel-certificate-deposit",
    subject: "Fit-to-Travel Certificate Deposit for {{trackingNumber}}",
    title: "Refundable Fit-to-Travel Certificate Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$80-$180",
    amountLabel: "Refundable Vaccination Record Processing Deposit",
    body: `Dear {{recipientName}},

This official billing form records a refundable vaccination record processing deposit for {{petName}}.

The deposit applies when a vaccination record must be reviewed, verified, or completed before travel clearance. If valid proof is accepted, the record will be updated and the billing adjustment will follow the refund terms below.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please provide any available vaccination proof to Apex support so the documentation desk can complete verification.`,
    category: "Veterinary documentation",
    description: "Refundable deposit for vaccination record review or processing.",
    id: "refundable-vaccination-record-processing-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms:
      "Refunded if valid vaccine proof is accepted. If administered, actual vet cost is deducted.",
    slug: "refundable-vaccination-record-processing-deposit",
    subject: "Vaccination Record Processing Deposit for {{trackingNumber}}",
    title: "Refundable Vaccination Record Processing Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$150-$350",
    amountLabel: "Refundable Crate Assignment Security Deposit",
    body: `Dear {{recipientName}},

This document records a refundable crate assignment security deposit for {{petName}} and shipment reference {{trackingNumber}}.

The deposit is used when a transport crate is assigned to the shipment and must be returned, cleared, or inspected after delivery. Crate condition and return status will be recorded in the shipment history.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please review the crate assignment details and contact Apex support if the crate type or delivery arrangement needs adjustment.`,
    category: "Billing notice",
    description: "Refundable security deposit for assigning a pet travel crate.",
    id: "refundable-crate-assignment-security-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms: "Refunded after the crate is returned or cleared with no damage.",
    slug: "refundable-crate-assignment-security-deposit",
    subject: "Crate Assignment Security Deposit for {{trackingNumber}}",
    title: "Refundable Crate Assignment Security Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$50-$120",
    amountLabel: "Refundable Crate Safety Equipment Deposit",
    body: `Dear {{recipientName}},

This official billing form records a refundable crate safety equipment deposit for {{petName}}.

The deposit covers assigned crate accessories such as bowls, water attachment, lining, labels, or other route-approved safety equipment. Apex will record whether the items are used, returned, or cleared at delivery.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please review the equipment assignment and contact Apex support if the shipment requires special handling equipment.`,
    category: "Billing notice",
    description: "Refundable deposit for crate setup accessories and safety equipment.",
    id: "refundable-crate-safety-equipment-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms:
      "Refunded if bowls, water attachment, lining, and accessories are returned or unused.",
    slug: "refundable-crate-safety-equipment-deposit",
    subject: "Crate Safety Equipment Deposit for {{trackingNumber}}",
    title: "Refundable Crate Safety Equipment Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$40-$100",
    amountLabel: "Refundable Feeding & Care Deposit",
    body: `Dear {{recipientName}},

This document records a refundable feeding and care deposit for {{petName}} during shipment reference {{trackingNumber}}.

The deposit applies only when feeding, hydration support, or handler care service is required during holding, transfer, or long-distance routing. Any completed care activity should be recorded in the pet travel history.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please provide any feeding instructions, allergy notes, or schedule preferences before the service is used.`,
    category: "Live animal transport",
    description: "Refundable deposit for feeding and handler care services.",
    id: "refundable-feeding-care-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms: "Refunded if feeding service is not used. If used, food or care cost is deducted.",
    slug: "refundable-feeding-care-deposit",
    subject: "Feeding and Care Deposit for {{trackingNumber}}",
    title: "Refundable Feeding & Care Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$50-$150",
    amountLabel: "Refundable Climate Monitoring Deposit",
    body: `Dear {{recipientName}},

This official billing form records a refundable climate monitoring deposit for {{petName}}.

The deposit applies when a temperature sensor, crate monitor, or climate tracking device is assigned to the shipment. The device assignment and condition will be reflected in the shipment or pet transport record.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please review the climate monitoring record and contact Apex support if route conditions require additional handling notes.`,
    category: "Live animal transport",
    description: "Refundable deposit for temperature or climate monitoring equipment.",
    id: "refundable-climate-monitoring-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms: "Refunded if no sensor or device is used, or if the device is returned working.",
    slug: "refundable-climate-monitoring-deposit",
    subject: "Climate Monitoring Deposit for {{trackingNumber}}",
    title: "Refundable Climate Monitoring Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$100-$300",
    amountLabel: "Refundable Emergency Care Reserve",
    body: `Dear {{recipientName}},

This document records a refundable emergency care reserve for {{petName}} while shipment reference {{trackingNumber}} remains under Apex custody.

The reserve is used only if verified emergency care, immediate welfare support, or urgent veterinary assistance becomes necessary during transit. Any deduction must be supported by written proof or a service receipt.

Reserve amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please review the reserve terms and keep Apex support informed of any medical history or special care instructions.`,
    category: "Live animal transport",
    description: "Refundable reserve for documented emergency pet care.",
    id: "refundable-emergency-care-reserve",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms:
      "Refunded if no emergency care is needed. Any deduction must include proof or receipt.",
    slug: "refundable-emergency-care-reserve",
    subject: "Emergency Care Reserve for {{trackingNumber}}",
    title: "Refundable Emergency Care Reserve",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$75-$200 per day",
    amountLabel: "Refundable Temporary Holding Deposit",
    body: `Dear {{recipientName}},

This official billing form records a refundable temporary holding deposit for shipment reference {{trackingNumber}}.

The deposit applies only when a delay, rescheduling window, facility hold, or boarding period must be covered while the shipment remains under documented care. Apex will record the hold reason and dates in the shipment timeline.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please confirm pickup, delivery, or release instructions so the operations team can minimize holding time wherever possible.`,
    category: "Billing notice",
    description: "Refundable daily deposit for temporary holding or delay care.",
    id: "refundable-temporary-holding-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms:
      "Refunded if pickup or shipment happens on schedule. Used only for documented delay costs.",
    slug: "refundable-temporary-holding-deposit",
    subject: "Temporary Holding Deposit for {{trackingNumber}}",
    title: "Refundable Temporary Holding Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$25-$75",
    amountLabel: "Refundable Handoff Documentation Deposit",
    body: `Dear {{recipientName}},

This document records a refundable handoff documentation deposit for shipment reference {{trackingNumber}}.

The deposit applies when photo evidence, file documentation, delivery confirmation records, or recipient handoff materials are specifically requested for the shipment. Apex recommends including basic handoff evidence at no extra charge whenever possible.

Deposit amount: {{amountDue}}
Refund or adjustment terms: {{refundTerms}}

Please review the requested documentation type and contact Apex support if additional delivery proof is required.`,
    category: "General authorization",
    description: "Refundable deposit for optional handoff proof and file documentation.",
    id: "refundable-handoff-documentation-deposit",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or secure payment portal only.",
    refundTerms:
      "Refunded if photo or file documentation is not produced; include it free when possible.",
    slug: "refundable-handoff-documentation-deposit",
    subject: "Handoff Documentation Deposit for {{trackingNumber}}",
    title: "Refundable Handoff Documentation Deposit",
    variables: standardOfficialDocumentVariables,
  },
  {
    amountDefault: "$0.00",
    amountLabel: "Custom billing amount",
    body: `Dear {{recipientName}},

This official billing form has been prepared by {{companyName}} for the service, deposit, adjustment, or compliance item listed below.

Document purpose: enter the billing purpose here.
Shipment reference: {{trackingNumber}}
Amount: {{amountDue}}
Terms: {{refundTerms}}

Please review the details and contact Apex support if any correction is required before payment or approval is completed.`,
    category: "Billing notice",
    description: "Blank reusable billing form for future fee or document types.",
    id: "custom-billing-form",
    isActive: true,
    paymentInstructions: "Use the approved Apex invoice or payment portal.",
    refundTerms: "Enter the applicable billing, refund, or adjustment terms.",
    slug: "custom-billing-form",
    subject: "Official Billing Form for {{trackingNumber}}",
    title: "Custom Official Billing Form",
    variables: standardOfficialDocumentVariables,
  },
];
