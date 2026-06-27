import {
  BadgeCheck,
  BellRing,
  Boxes,
  Building2,
  CircleDollarSign,
  Clock3,
  Dog,
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
  Warehouse,
} from "lucide-react";

export const marketingNavItems = [
  { href: "/services", label: "Services" },
  { href: "/parcel-delivery", label: "Parcel" },
  { href: "/pet-transportation", label: "Pets" },
  { href: "/freight", label: "Freight" },
  { href: "/tracking", label: "Tracking" },
  { href: "/pricing", label: "Pricing" },
] as const;

export const companyNavItems = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const serviceCards = [
  {
    description: "Same-day, next-day, and scheduled delivery flows with clear status visibility.",
    href: "/parcel-delivery",
    icon: PackageCheck,
    title: "Parcel Delivery",
  },
  {
    description:
      "Specialized handling for pets, wellness checks, and travel documentation support.",
    href: "/pet-transportation",
    icon: Dog,
    title: "Pet Transportation",
  },
  {
    description: "Road, air, sea, rail, and multimodal freight for high-value supply chains.",
    href: "/freight",
    icon: Ship,
    title: "Freight",
  },
  {
    description: "Live milestone tracking, proactive alerts, and exception visibility.",
    href: "/tracking",
    icon: Route,
    title: "Tracking",
  },
] as const;

export const capabilityHighlights = [
  { icon: Globe2, label: "Global network", value: "62 countries" },
  { icon: Clock3, label: "Delivery SLA", value: "98.8%" },
  { icon: Warehouse, label: "Hub coverage", value: "180+ lanes" },
  { icon: Headphones, label: "Support", value: "24/7" },
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

export const trackingEvents = [
  { status: "Booked", time: "08:12", tone: "success" },
  { status: "Warehouse check-in", time: "09:30", tone: "info" },
  { status: "In transit", time: "10:45", tone: "accent" },
  { status: "Delivery window", time: "14:00-16:00", tone: "warning" },
] as const;

export const trustSignals = [
  { icon: ShieldCheck, text: "Secure role-based access" },
  { icon: Sparkles, text: "Premium customer experience" },
  { icon: CircleDollarSign, text: "Transparent billing flows" },
  { icon: Route, text: "Exception-aware tracking" },
] as const;
