import type { EmailLogStatus, EmailProvider, EmailTemplateCategory } from "@prisma/client";

export type EmailActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialEmailActionState: EmailActionState = {
  status: "idle",
};

export type EmailRecipientOption = {
  email: string;
  id: string;
  label: string;
  name: string;
};

export type EmailShipmentOption = {
  customerEmail: string | null;
  customerName: string | null;
  id: string;
  label: string;
  shipmentNumber: string;
  status: string;
};

export type EmailTemplateOption = {
  bodyHtml: string;
  category: EmailTemplateCategory;
  defaultVariables?: Record<string, string>;
  id: string;
  label: string;
  slug: string;
  source: "built_in_client_email" | "email";
  subject: string;
  templateId: string | null;
  variables: string[];
};

export type EmailComposerOptions = {
  recipients: EmailRecipientOption[];
  shipments: EmailShipmentOption[];
  templates: EmailTemplateOption[];
};

export type EmailPreview = {
  bodyHtml: string;
  recipient: string;
  subject: string;
};

export type EmailTemplateListItem = {
  category: EmailTemplateCategory;
  composeTemplateId?: string | null;
  canEdit?: boolean;
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
  source?: "built_in_client_email" | "database";
  subject: string;
  updatedAt: string;
  version: number;
};

export type EmailTemplateDetail = EmailTemplateListItem & {
  bodyHtml: string;
  bodyText: string | null;
  preheader: string | null;
  variables: string[];
};

export type EmailLogListItem = {
  category: EmailTemplateCategory;
  createdAt: string;
  failureReason: string | null;
  id: string;
  provider: EmailProvider;
  recipientEmail: string;
  recipientName: string | null;
  sentAt: string | null;
  sentBy: string | null;
  shipmentNumber: string | null;
  status: EmailLogStatus;
  subject: string;
  templateName: string | null;
  trackingNumber: string | null;
};
