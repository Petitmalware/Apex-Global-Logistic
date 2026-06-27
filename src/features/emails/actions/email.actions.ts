"use server";

import { revalidatePath } from "next/cache";
import { AuditAction, EmailTemplateStatus } from "@prisma/client";

import { emailTemplateFormSchema } from "@/features/emails/schemas/email.schemas";
import { htmlToPlainText, sanitizeEmailHtml } from "@/features/emails/services/email-sanitizer";
import type { EmailActionState } from "@/features/emails/types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/errors";
import { PERMISSIONS } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function parseVariables(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function canAccessOrganization(
  user: { organizationId: string | null; roles: string[] },
  organizationId: string | null,
) {
  return user.roles.includes(AUTH_ROLES.SUPER_ADMIN) || user.organizationId === organizationId;
}

function errorState(error: unknown): EmailActionState {
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: "error",
    };
  }

  return {
    message: "Unable to save email template.",
    status: "error",
  };
}

export async function updateEmailTemplateAction(
  templateId: string,
  _previousState: EmailActionState,
  formData: FormData,
): Promise<EmailActionState> {
  const user = await requirePermission(PERMISSIONS.EMAILS_MANAGE);
  const parsed = emailTemplateFormSchema.safeParse({
    bodyHtml: getString(formData, "bodyHtml"),
    category: getString(formData, "category"),
    isActive: getBoolean(formData, "isActive"),
    name: getString(formData, "name"),
    preheader: getString(formData, "preheader"),
    subject: getString(formData, "subject"),
    variables: parseVariables(getString(formData, "variables")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please review the template details.",
      status: "error",
    };
  }

  try {
    const template = await prisma.emailTemplate.findUnique({
      where: {
        id: templateId,
      },
    });

    if (!template || template.deletedAt || !canAccessOrganization(user, template.organizationId)) {
      throw new AuthError("Email template not found.", 404, "EMAIL_TEMPLATE_NOT_FOUND");
    }

    const bodyHtml = sanitizeEmailHtml(parsed.data.bodyHtml);
    const updatedTemplate = await prisma.emailTemplate.update({
      data: {
        bodyHtml,
        bodyText: htmlToPlainText(bodyHtml),
        category: parsed.data.category,
        isActive: parsed.data.isActive,
        name: parsed.data.name,
        preheader: parsed.data.preheader,
        status: parsed.data.isActive ? EmailTemplateStatus.ACTIVE : EmailTemplateStatus.DRAFT,
        subject: parsed.data.subject,
        updatedById: user.id,
        variables: parsed.data.variables,
      },
      where: {
        id: template.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        actorId: user.id,
        after: {
          category: updatedTemplate.category,
          isActive: updatedTemplate.isActive,
          name: updatedTemplate.name,
        },
        entityId: updatedTemplate.id,
        entityType: "email_template",
        organizationId: updatedTemplate.organizationId,
      },
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/admin/emails/templates");
  revalidatePath(`/admin/emails/templates/${templateId}`);

  return {
    message: "Email template saved.",
    status: "success",
  };
}
