import {
  BadgeCheck,
  BellRing,
  Boxes,
  Building2,
  CircleDollarSign,
  Clock3,
  Dog,
  FileCheck2,
  Globe2,
  Headphones,
  HeartPulse,
  MapPin,
  PackageCheck,
  Plane,
  Route,
  ShieldCheck,
  Ship,
  Sparkles,
  Truck,
} from "lucide-react";

export const marketingNavItems = [
  { href: "/services", label: "Services" },
  { href: "/parcel-delivery", label: "Parcel" },
  { href: "/pet-transportation", label: "Pets" },
  { href: "/freight", label: "Freight" },
  { href: "/tracking", label: "Tracking" },
  { href: "/pricing", label: "Pricing" },
] as const;

export const primaryMarketingNavItems = [
  { href: "/services", label: "Services" },
  { href: "/tracking", label: "Tracking" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const marketingImages = {
  compliance: {
    alt: "Delivery paperwork and logistics documents prepared for customer approval",
    src: "/images/delivery-documents.jpg",
  },
  containers: {
    alt: "Cargo containers at a shipping terminal for international freight movement",
    src: "/images/cargo-containers.jpg",
  },
  freight: {
    alt: "Long-haul freight truck moving through a rural logistics lane",
    src: "/images/freight-truck.jpg",
  },
  hero: {
    alt: "Modern logistics warehouse with parcels staged for delivery dispatch",
    src: "/images/global-logistics-hero.png",
  },
  parcel: {
    alt: "Courier handling parcel delivery and logistics paperwork",
    src: "/images/courier-parcel-delivery.jpg",
  },
  parcelOperations: {
    alt: "Parcel boxes and packing supplies staged for shipment preparation",
    src: "/images/parcel-sorting-operations.jpg",
  },
  pet: {
    alt: "Pet care photo representing safe pet transportation service",
    src: "/images/pet-transport-care.jpg",
  },
  petHandoff: {
    alt: "Customer carrying a ventilated pet travel carrier",
    src: "/images/pet-carrier-handoff.jpg",
  },
  services: {
    alt: "Modern logistics warehouse prepared for parcel and freight dispatch",
    src: "/images/logistics-warehouse.jpg",
  },
  tracking: {
    alt: "Logistics operator reviewing shipment movement on a warehouse tablet",
    src: "/images/shipment-tracking-operations.jpg",
  },
} as const;

export const companyNavItems = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/policy", label: "Policy" },
  { href: "/privacy", label: "Privacy" },
] as const;

export const serviceCards = [
  {
    description: "Same-day, next-day, and scheduled delivery flows with clear status visibility.",
    href: "/parcel-delivery",
    icon: PackageCheck,
    image: marketingImages.parcel,
    title: "Parcel Delivery",
  },
  {
    description:
      "Specialized handling for pets, wellness checks, and travel documentation support.",
    href: "/pet-transportation",
    icon: Dog,
    image: marketingImages.pet,
    title: "Pet Transportation",
  },
  {
    description: "Road, air, sea, rail, and multimodal freight for high-value supply chains.",
    href: "/freight",
    icon: Ship,
    image: marketingImages.freight,
    title: "Freight",
  },
  {
    description: "Live milestone tracking, proactive alerts, and exception visibility.",
    href: "/tracking",
    icon: Route,
    image: marketingImages.tracking,
    title: "Tracking",
  },
] as const;

export const capabilityHighlights = [
  { icon: Globe2, label: "Tracking access", value: "Public" },
  { icon: Clock3, label: "Status visibility", value: "24/7" },
  { icon: FileCheck2, label: "Billing records", value: "Itemized" },
  { icon: Headphones, label: "Customer support", value: "Direct" },
] as const;

export const paymentConfidenceItems = [
  {
    description:
      "Every payment request should reference a numbered invoice, the related shipment, the recipient, the amount, and the service being charged.",
    icon: FileCheck2,
    title: "Verify the invoice",
  },
  {
    description:
      "Use only the company-approved payment instructions shown on the current invoice. Contact support before paying if any account detail or amount is unexpected.",
    icon: ShieldCheck,
    title: "Confirm payment instructions",
  },
  {
    description:
      "A successful payment should produce a receipt and a visible billing record. Any applicable terms are shown on the related invoice before payment.",
    icon: CircleDollarSign,
    title: "Keep the receipt and terms",
  },
] as const;

export const processSteps = [
  {
    description: "Book parcel, pet, or freight shipments through one structured intake.",
    icon: Boxes,
    title: "Book",
  },
  {
    description: "Apex plans the best route, carrier mix, warehouse handoff, and alert rules.",
    icon: MapPin,
    title: "Coordinate",
  },
  {
    description: "Track milestones, documents, invoices, and exceptions in one command view.",
    icon: BellRing,
    title: "Monitor",
  },
] as const;

export const deliveryProofCards = [
  {
    image: marketingImages.parcelOperations,
    label: "Door-to-door parcel handling",
    text: "Packages are received, labelled, routed, and confirmed through structured handoff records.",
  },
  {
    image: marketingImages.petHandoff,
    label: "Pet travel care",
    text: "Live animal shipments can include crate checks, health documents, temperature notes, and signed release paperwork.",
  },
  {
    image: marketingImages.containers,
    label: "Freight and customs lanes",
    text: "Freight moves are documented with route, container, cargo, driver, and exception records.",
  },
] as const;

export const parcelFeatures = [
  {
    icon: Truck,
    title: "Urban delivery",
    text: "Dense route planning for same-day and next-day parcel flows.",
  },
  {
    icon: ShieldCheck,
    title: "Chain of custody",
    text: "Signature, proof-of-delivery, and exception controls.",
  },
  {
    icon: BadgeCheck,
    title: "Service levels",
    text: "Priority, standard, fragile, and scheduled parcel handling.",
  },
] as const;

export const petFeatures = [
  {
    icon: HeartPulse,
    title: "Wellness first",
    text: "Comfort checks, crate handling, and travel-readiness workflows.",
  },
  {
    icon: Dog,
    title: "Species-aware moves",
    text: "Structured pet profiles for dogs, cats, birds, reptiles, and more.",
  },
  {
    icon: ShieldCheck,
    title: "Document control",
    text: "Vaccination, microchip, and health certificate status visibility.",
  },
] as const;

export const freightFeatures = [
  {
    icon: Ship,
    title: "Sea freight",
    text: "Container, seal, customs, and port handoff visibility.",
  },
  {
    icon: Plane,
    title: "Air cargo",
    text: "Priority movement for critical, high-value, and time-sensitive freight.",
  },
  {
    icon: Building2,
    title: "Warehouse flow",
    text: "Cross-dock, storage, and regional distribution coordination.",
  },
] as const;

export const pricingPlans = [
  {
    cta: "Start shipping",
    description: "For individuals and small teams shipping parcels or pets.",
    features: ["Parcel booking", "Pet transport intake", "Tracking alerts", "Email support"],
    name: "Launch",
    price: "$49",
  },
  {
    cta: "Talk to sales",
    description: "For growing operations with regular shipments and support needs.",
    features: ["Priority support", "Freight quoting", "Warehouse handoffs", "Invoice management"],
    name: "Network",
    price: "$249",
  },
  {
    cta: "Design network",
    description: "For enterprise logistics networks and complex freight programs.",
    features: ["Dedicated operations", "Custom SLAs", "API integrations", "Audit reporting"],
    name: "Command",
    price: "Custom",
  },
] as const;

export const faqs = [
  {
    answer:
      "Apex supports parcel delivery, pet transportation, road freight, air cargo, sea freight, rail, and multimodal logistics.",
    question: "What shipment types does Apex support?",
  },
  {
    answer:
      "Tracking pages can show operational milestones, route status, carrier handoffs, exceptions, and delivery confirmation once business integrations are connected.",
    question: "Can customers track shipments in real time?",
  },
  {
    answer:
      "Pet transportation includes fields for species, crate requirements, health certificates, vaccination status, microchips, and handling instructions.",
    question: "How is pet transport handled differently?",
  },
  {
    answer:
      "The platform is built with role-based access, audit logs, secure cookies, hashed tokens, and a Prisma/PostgreSQL data layer.",
    question: "Is the platform ready for secure operations?",
  },
  {
    answer:
      "Pricing can be configured by service level, shipment mode, support coverage, integrations, and custom enterprise network requirements.",
    question: "How does pricing work?",
  },
] as const;

export const trustSignals = [
  { icon: ShieldCheck, text: "Secure role-based access" },
  { icon: Sparkles, text: "Premium customer experience" },
  { icon: CircleDollarSign, text: "Transparent billing flows" },
  { icon: Route, text: "Exception-aware tracking" },
] as const;

export const clientAssuranceCards = [
  {
    icon: BadgeCheck,
    text: "Every movement starts with a structured shipment record, recipient details, service type, carrier notes, package or pet information, and a tracking reference.",
    title: "Verified shipment record",
  },
  {
    icon: Route,
    text: "Registered customers can use their dashboard, while unregistered recipients can still track using the shipment number or carrier reference.",
    title: "Tracking with or without an account",
  },
  {
    icon: FileCheck2,
    text: "Invoices, receipts, shipment labels, and official documents are prepared with company letterhead and clear billing records.",
    title: "Professional documents",
  },
  {
    icon: Headphones,
    text: "Customers can request help through contact flows and live support while admins keep conversations, updates, and shipment notes tied to the record.",
    title: "Support connected to the shipment",
  },
] as const;

export const customerJourneySteps = [
  {
    description:
      "Apex collects sender, receiver, address, shipment type, package or pet details, preferred timing, and any handling instructions.",
    title: "1. Intake and verification",
  },
  {
    description:
      "The operations team creates the shipment, assigns a tracking number, prepares required documents, and records carrier or route details.",
    title: "2. Shipment setup",
  },
  {
    description:
      "Customers receive status updates for pickup, facility check-in, in transit, hold, delay, out for delivery, and delivery confirmation.",
    title: "3. Live progress updates",
  },
  {
    description:
      "When delivery is completed, signed receipts and related paperwork confirm the handoff and close the delivery record.",
    title: "4. Delivery confirmation",
  },
] as const;

export const accountabilityCards = [
  {
    label: "Clear identity",
    value: "Named sender and receiver records",
  },
  {
    label: "Traceable movement",
    value: "Timeline events with location notes",
  },
  {
    label: "Document proof",
    value: "Invoices, receipts, labels, and approvals",
  },
  {
    label: "Payment clarity",
    value: "Invoice terms shown before payment",
  },
  {
    label: "Admin controls",
    value: "Role-based access and activity logs",
  },
  {
    label: "Customer access",
    value: "Dashboard or public tracking code",
  },
] as const;

export const gettingStartedOptions = [
  {
    cta: "Track now",
    description:
      "Use the public tracking page when you already have a shipment number or carrier reference. No account is required for basic status visibility.",
    href: "/tracking",
    icon: Route,
    title: "I already have a tracking code",
  },
  {
    cta: "Create account",
    description:
      "Create a customer account when you want a dashboard for shipments, documents, invoices, support messages, and delivery history.",
    href: "/register",
    icon: BadgeCheck,
    title: "I want a customer account",
  },
  {
    cta: "Talk to operations",
    description:
      "Contact Apex when the shipment needs special handling, pet transportation, freight planning, billing help, or official paperwork.",
    href: "/contact",
    icon: Headphones,
    title: "I need help setting up delivery",
  },
] as const;

export const clientPreparationLists = [
  {
    items: [
      "Sender name, pickup location, and contact details",
      "Receiver name, delivery address, phone, and email",
      "Package weight, quantity, value, and handling instructions",
      "Preferred delivery timing and payment method",
    ],
    title: "Parcel and documents",
  },
  {
    items: [
      "Pet name, species, breed, age, weight, and photos",
      "Vaccination record, health certificate, and vet contact where available",
      "Crate information, feeding notes, medication, and comfort instructions",
      "Receiver delivery address and any special handoff requirements",
    ],
    title: "Pet transportation",
  },
  {
    items: [
      "Cargo description, quantity, weight, and dimensions",
      "Pickup and destination points, route constraints, and delivery deadline",
      "Container, machinery, vehicle, or freight document details",
      "Driver, carrier, insurance, customs, or warehouse requirements",
    ],
    title: "Freight movement",
  },
] as const;

export const serviceDetailCards = [
  {
    description:
      "Parcel shipments can include sender and receiver details, package photos, labels, invoices, receipts, delivery notes, and timeline updates.",
    highlights: ["Tracking number", "Package condition notes", "Printable label", "Receipt"],
    image: marketingImages.parcel,
    title: "Parcel delivery",
  },
  {
    description:
      "Pet shipments can include pet profile data, crate assignment, health documents, feeding schedules, temperature logs, vet checks, and travel history.",
    highlights: ["Pet profile", "Vaccination records", "Crate and care notes", "Delivery proof"],
    image: marketingImages.pet,
    title: "Pet transportation",
  },
  {
    description:
      "Freight moves can include cargo records, containers, route assignment, driver assignment, ETA notes, freight documents, and tracking updates.",
    highlights: ["Cargo manifest", "Driver assignment", "Route notes", "Freight paperwork"],
    image: marketingImages.freight,
    title: "Freight transport",
  },
] as const;

export const documentTrustItems = [
  {
    description:
      "Issued when a shipment, pet movement, or freight job is opened and assigned a tracking reference.",
    title: "Shipment registration notice",
  },
  {
    description:
      "Professional billing document showing the recipient, line items, totals, payment status, and shipment reference.",
    title: "Invoice and payment receipt",
  },
  {
    description:
      "Used when a shipment needs a documented service adjustment, billing update, or delivery-related customer notice.",
    title: "Service and billing notice",
  },
  {
    description:
      "Documents movement milestones, locations, hold reasons, customer instructions, delivery confirmation, and signature requirements.",
    title: "Tracking and delivery proof",
  },
] as const;

export const trustPillars = [
  {
    description:
      "The customer sees the service, amount, payment status, and applicable terms before payment is requested.",
    icon: CircleDollarSign,
    title: "Transparent billing",
  },
  {
    description:
      "Shipment updates are recorded into the timeline so the customer can see what happened, where it happened, and what to do next.",
    icon: BellRing,
    title: "Visible updates",
  },
  {
    description:
      "Apex keeps professional paperwork tied to the customer, shipment, invoice, pet record, freight job, or support conversation.",
    icon: FileCheck2,
    title: "Document trail",
  },
  {
    description:
      "Admins manage sensitive operations from protected dashboards, while customers only see the pages and records meant for them.",
    icon: ShieldCheck,
    title: "Role-based access",
  },
] as const;
