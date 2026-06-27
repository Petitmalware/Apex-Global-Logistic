import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BellRing,
  Building2,
  BrainCircuit,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Gauge,
  Headphones,
  KeyRound,
  LayoutDashboard,
  MailPlus,
  MapPinned,
  MessageSquareText,
  Bell,
  PackageCheck,
  PackageSearch,
  PawPrint,
  Plane,
  Route,
  Settings,
  ShieldCheck,
  TicketCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

import type { NavigationItem } from "@/components/ui/navigation";
import { AUTH_ROLES, type AppRole } from "@/lib/auth/constants";

export type DashboardRole = "admin" | "agent" | "customer" | "support" | "super-admin";

export type DashboardMetric = {
  delta: string;
  icon: LucideIcon;
  label: string;
  tone: "accent" | "info" | "success" | "warning";
  value: string;
};

export type DashboardTask = {
  label: string;
  meta: string;
  status: "Attention" | "Blocked" | "Live" | "Ready" | "Review";
};

export type DashboardActivity = {
  description: string;
  label: string;
  time: string;
};

export type DashboardConfig = {
  activity: DashboardActivity[];
  badge: string;
  description: string;
  metrics: DashboardMetric[];
  operations: DashboardTask[];
  primaryAction: string;
  role: DashboardRole;
  roleLabel: string;
  secondaryAction: string;
  title: string;
  trend: Array<{ label: string; value: number }>;
};

export const dashboardNavItems: NavigationItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/shipments", icon: PackageSearch, label: "Shipments" },
  { href: "/pet-transport", icon: PawPrint, label: "Pet Transport" },
  { href: "/freight-transport", icon: Truck, label: "Freight" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/ai", icon: BrainCircuit, label: "AI Assist" },
  { href: "/admin/emails", icon: MailPlus, label: "Email Studio" },
  { href: "/customer", icon: PackageSearch, label: "Customer" },
  { href: "/agent", badge: "12", icon: Route, label: "Agent" },
  { href: "/support", badge: "5", icon: Headphones, label: "Support" },
  { href: "/admin", icon: Building2, label: "Admin" },
  { href: "/super-admin", icon: ShieldCheck, label: "Super Admin" },
];

export const dashboardQuickNav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/analytics", label: "Analytics" },
  { href: "/shipments", label: "Shipments" },
  { href: "/pet-transport", label: "Pet Transport" },
  { href: "/freight-transport", label: "Freight" },
  { href: "/notifications", label: "Notifications" },
  { href: "/ai", label: "AI Assist" },
  { href: "/admin/emails", label: "Email Studio" },
  { href: "/customer", label: "Customer" },
  { href: "/agent", label: "Agent" },
  { href: "/support", label: "Support" },
  { href: "/admin", label: "Admin" },
  { href: "/super-admin", label: "Super Admin" },
] satisfies Array<{ href: string; label: string }>;

export const roleHomeByRole = {
  [AUTH_ROLES.ADMIN]: "/admin",
  [AUTH_ROLES.AGENT]: "/agent",
  [AUTH_ROLES.CUSTOMER]: "/customer",
  [AUTH_ROLES.SUPPORT]: "/support",
  [AUTH_ROLES.SUPER_ADMIN]: "/super-admin",
} satisfies Record<AppRole, string>;

export const dashboardConfigs = {
  admin: {
    activity: [
      {
        description: "Warehouse B capacity threshold updated for regional dispatch.",
        label: "Network policy adjusted",
        time: "8 min ago",
      },
      {
        description: "Three invoice batches are ready for finance review.",
        label: "Billing queue prepared",
        time: "22 min ago",
      },
      {
        description: "New lane performance report generated for leadership.",
        label: "Analytics refreshed",
        time: "1 hr ago",
      },
    ],
    badge: "Admin control",
    description:
      "Monitor network performance, team workload, billing health, and operational exceptions from one command center.",
    metrics: [
      { delta: "+8.2%", icon: Truck, label: "Active shipments", tone: "accent", value: "1,284" },
      {
        delta: "+4 hubs",
        icon: Warehouse,
        label: "Warehouse utilization",
        tone: "info",
        value: "82%",
      },
      { delta: "-12%", icon: Clock3, label: "Late exceptions", tone: "success", value: "34" },
      { delta: "$128k", icon: CreditCard, label: "Open invoices", tone: "warning", value: "418" },
    ],
    operations: [
      { label: "Approve Dubai cold-chain capacity", meta: "Freight network", status: "Review" },
      {
        label: "Resolve 14 delayed customs handoffs",
        meta: "Exception queue",
        status: "Attention",
      },
      { label: "Publish June billing packet", meta: "Finance desk", status: "Ready" },
      { label: "Verify driver onboarding batch", meta: "Fleet operations", status: "Live" },
    ],
    primaryAction: "Review network",
    role: "admin",
    roleLabel: "Admin",
    secondaryAction: "Export report",
    title: "Operations command center",
    trend: [
      { label: "Mon", value: 64 },
      { label: "Tue", value: 71 },
      { label: "Wed", value: 77 },
      { label: "Thu", value: 81 },
      { label: "Fri", value: 86 },
      { label: "Sat", value: 83 },
      { label: "Sun", value: 91 },
    ],
  },
  agent: {
    activity: [
      {
        description: "Route AGL-3928 was reassigned to Driver K. Mensah.",
        label: "Route reassigned",
        time: "4 min ago",
      },
      {
        description: "Two parcels need photo confirmation at pickup.",
        label: "Pickup proof required",
        time: "19 min ago",
      },
      {
        description: "Pet transport crate check completed for Luna.",
        label: "Handling checklist cleared",
        time: "38 min ago",
      },
    ],
    badge: "Agent workspace",
    description:
      "Coordinate pickups, validate packages, handle exceptions, and keep delivery routes moving without losing context.",
    metrics: [
      { delta: "+6", icon: PackageCheck, label: "Assigned pickups", tone: "accent", value: "42" },
      { delta: "98.8%", icon: Gauge, label: "On-time route SLA", tone: "success", value: "96%" },
      { delta: "12 live", icon: MapPinned, label: "Driver check-ins", tone: "info", value: "31" },
      { delta: "3 urgent", icon: BellRing, label: "Exception alerts", tone: "warning", value: "8" },
    ],
    operations: [
      { label: "Confirm pickup scan for AGL-2026-0148", meta: "Priority parcel", status: "Ready" },
      { label: "Attach airway bill to pet transport", meta: "Animal handling", status: "Review" },
      { label: "Escalate missing warehouse scan", meta: "Lagos hub", status: "Attention" },
      { label: "Dispatch Route 7B handoff notes", meta: "Driver desk", status: "Live" },
    ],
    primaryAction: "Open dispatch",
    role: "agent",
    roleLabel: "Agent",
    secondaryAction: "View manifest",
    title: "Dispatch and route desk",
    trend: [
      { label: "8a", value: 18 },
      { label: "10a", value: 32 },
      { label: "12p", value: 44 },
      { label: "2p", value: 39 },
      { label: "4p", value: 51 },
      { label: "6p", value: 56 },
    ],
  },
  customer: {
    activity: [
      {
        description: "AGL-2026-0148 cleared the Accra arrival facility.",
        label: "Parcel milestone updated",
        time: "12 min ago",
      },
      {
        description: "Your freight quote for 12 pallets was saved as a draft.",
        label: "Quote draft saved",
        time: "1 hr ago",
      },
      {
        description: "Delivery window confirmed for tomorrow morning.",
        label: "Delivery appointment set",
        time: "2 hrs ago",
      },
    ],
    badge: "Customer portal",
    description:
      "Track parcels, book specialist transport, manage quotes, and keep every delivery conversation in one place.",
    metrics: [
      {
        delta: "2 arriving",
        icon: PackageSearch,
        label: "Active shipments",
        tone: "accent",
        value: "7",
      },
      { delta: "+1 quote", icon: Plane, label: "Freight requests", tone: "info", value: "3" },
      {
        delta: "On track",
        icon: Clock3,
        label: "Next delivery",
        tone: "success",
        value: "9:30 AM",
      },
      {
        delta: "1 open",
        icon: MessageSquareText,
        label: "Support threads",
        tone: "warning",
        value: "2",
      },
    ],
    operations: [
      { label: "Approve delivery window for AGL-0148", meta: "Parcel delivery", status: "Ready" },
      { label: "Upload vaccine document for Milo", meta: "Pet transport", status: "Review" },
      { label: "Compare freight quote options", meta: "Freight booking", status: "Live" },
      { label: "Reply to customs clarification", meta: "Support thread", status: "Attention" },
    ],
    primaryAction: "Book shipment",
    role: "customer",
    roleLabel: "Customer",
    secondaryAction: "Track package",
    title: "Shipment control room",
    trend: [
      { label: "Jan", value: 6 },
      { label: "Feb", value: 9 },
      { label: "Mar", value: 8 },
      { label: "Apr", value: 12 },
      { label: "May", value: 14 },
      { label: "Jun", value: 16 },
    ],
  },
  support: {
    activity: [
      {
        description: "Customer requested a pet travel document review.",
        label: "New support intake",
        time: "2 min ago",
      },
      {
        description: "AI draft prepared for delayed parcel apology.",
        label: "Reply suggestion ready",
        time: "16 min ago",
      },
      {
        description: "Refund approval workflow moved to admin review.",
        label: "Escalation transferred",
        time: "51 min ago",
      },
    ],
    badge: "Support cockpit",
    description:
      "Prioritize tickets, review customer context, use AI-assisted responses, and escalate exceptions with full shipment history.",
    metrics: [
      { delta: "-18%", icon: TicketCheck, label: "Open tickets", tone: "success", value: "58" },
      { delta: "12 min", icon: Clock3, label: "Median first reply", tone: "accent", value: "18m" },
      { delta: "92%", icon: ClipboardCheck, label: "Resolved SLA", tone: "info", value: "92%" },
      { delta: "5 high", icon: BellRing, label: "Escalations", tone: "warning", value: "9" },
    ],
    operations: [
      { label: "Reply to delayed parcel claim", meta: "Customer thread", status: "Ready" },
      { label: "Escalate missing driver proof", meta: "Operations handoff", status: "Attention" },
      { label: "Review AI reply for customs issue", meta: "AI assist", status: "Review" },
      { label: "Close resolved pet itinerary ticket", meta: "Support queue", status: "Live" },
    ],
    primaryAction: "Open queue",
    role: "support",
    roleLabel: "Support",
    secondaryAction: "View escalations",
    title: "Customer support cockpit",
    trend: [
      { label: "Mon", value: 72 },
      { label: "Tue", value: 64 },
      { label: "Wed", value: 59 },
      { label: "Thu", value: 54 },
      { label: "Fri", value: 48 },
      { label: "Sat", value: 42 },
    ],
  },
  "super-admin": {
    activity: [
      {
        description: "Permission bundle updated for regional administrators.",
        label: "RBAC policy changed",
        time: "6 min ago",
      },
      {
        description: "Audit export completed for security review.",
        label: "Audit package generated",
        time: "29 min ago",
      },
      {
        description: "System setting change approved for notification routing.",
        label: "Platform setting approved",
        time: "1 hr ago",
      },
    ],
    badge: "Super admin",
    description:
      "Govern platform access, security posture, audit activity, settings, and cross-tenant controls for the Apex network.",
    metrics: [
      { delta: "+14", icon: Users, label: "Managed users", tone: "accent", value: "8,420" },
      {
        delta: "99.99%",
        icon: Activity,
        label: "Platform uptime",
        tone: "success",
        value: "99.99%",
      },
      {
        delta: "2 today",
        icon: KeyRound,
        label: "Permission changes",
        tone: "warning",
        value: "18",
      },
      { delta: "Clean", icon: ShieldCheck, label: "Audit posture", tone: "info", value: "A" },
    ],
    operations: [
      { label: "Approve admin role grant", meta: "Access governance", status: "Review" },
      { label: "Inspect failed login spike", meta: "Security monitor", status: "Attention" },
      { label: "Publish global settings update", meta: "Platform controls", status: "Ready" },
      { label: "Review tenant audit export", meta: "Compliance desk", status: "Live" },
    ],
    primaryAction: "Review access",
    role: "super-admin",
    roleLabel: "Super Admin",
    secondaryAction: "Open audit log",
    title: "Platform governance",
    trend: [
      { label: "W1", value: 88 },
      { label: "W2", value: 91 },
      { label: "W3", value: 94 },
      { label: "W4", value: 93 },
      { label: "W5", value: 97 },
      { label: "W6", value: 99 },
    ],
  },
} satisfies Record<DashboardRole, DashboardConfig>;

export const overviewConfig: DashboardConfig = {
  ...dashboardConfigs.admin,
  badge: "Secure workspace",
  description:
    "A personalized operations overview for authenticated Apex users across shipments, support, billing, and access.",
  metrics: [
    { delta: "+11%", icon: Truck, label: "Shipments in motion", tone: "accent", value: "186" },
    { delta: "24/7", icon: Headphones, label: "Support coverage", tone: "info", value: "Live" },
    { delta: "98.8%", icon: Gauge, label: "Delivery SLA", tone: "success", value: "98.8%" },
    {
      delta: "4 roles",
      icon: Settings,
      label: "Workspace access",
      tone: "warning",
      value: "Ready",
    },
  ],
  operations: [
    {
      label: "Review today's shipment exceptions",
      meta: "Operations summary",
      status: "Attention",
    },
    { label: "Check support inbox health", meta: "Support desk", status: "Live" },
    { label: "Open customer shipment timeline", meta: "Customer portal", status: "Ready" },
    { label: "Review admin approval queue", meta: "Governance", status: "Review" },
  ],
  primaryAction: "Open operations",
  role: "admin",
  roleLabel: "Workspace",
  secondaryAction: "View reports",
  title: "Dashboard overview",
};
