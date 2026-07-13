"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction, SettingScope, type Prisma } from "@prisma/client";

import { officialDocumentTemplateSchema } from "@/features/official-documents/schemas/official-document.schemas";
import {
  getOfficialDocumentTemplates,
  OFFICIAL_DOCUMENT_TEMPLATES_SETTING_KEY,
} from "@/features/official-documents/queries/official-document.queries";
import type {
  OfficialDocumentActionState,
  OfficialDocumentTemplate,
} from "@/features/official-documents/types/official-document.types";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key).trim();

  return value || undefined;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseVariables(value: string) {
  return value
    .split(",")
    .map((variable) => variable.trim().replace(/[{}]/g, ""))
    .filter(Boolean);
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function persistTemplates(templates: OfficialDocumentTemplate[], userId: string) {
  const value = toJsonValue(templates);
  const existingSetting = await prisma.setting.findFirst({
    select: {
      id: true,
    },
    where: {
      key: OFFICIAL_DOCUMENT_TEMPLATES_SETTING_KEY,
      scope: SettingScope.GLOBAL,
    },
  });

  if (existingSetting) {
    await prisma.setting.update({
      data: {
        updatedById: userId,
        value,
      },
      where: {
        id: existingSetting.id,
      },
    });
  } else {
    await prisma.setting.create({
      data: {
        key: OFFICIAL_DOCUMENT_TEMPLATES_SETTING_KEY,
        scope: SettingScope.GLOBAL,
        updatedById: userId,
        value,
      },
    });
  }
}

export async function saveOfficialDocumentTemplateAction(
  templateId: string | null,
  _previousState: OfficialDocumentActionState,
  formData: FormData,
): Promise<OfficialDocumentActionState> {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const title = getString(formData, "title");
  const slug = slugify(getString(formData, "slug") || title);
  const id = templateId || slug;
  const parsed = officialDocumentTemplateSchema.safeParse({
    amountDefault: getOptionalString(formData, "amountDefault"),
    amountLabel: getOptionalString(formData, "amountLabel"),
    body: getString(formData, "body"),
    category: getString(formData, "category"),
    description: getString(formData, "description"),
    id,
    isActive: formData.get("isActive") === "on",
    paymentInstructions: getOptionalString(formData, "paymentInstructions"),
    refundTerms: getOptionalString(formData, "refundTerms"),
    slug,
    subject: getString(formData, "subject"),
    title,
    variables: parseVariables(getString(formData, "variables")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please review the document template fields.",
      status: "error",
    };
  }

  const templates = await getOfficialDocumentTemplates({ includeInactive: true });
  const duplicateSlug = templates.find(
    (template) => template.slug === parsed.data.slug && template.id !== parsed.data.id,
  );

  if (duplicateSlug) {
    return {
      fieldErrors: {
        slug: ["Another document template already uses this slug."],
      },
      message: "Please choose a unique document slug.",
      status: "error",
    };
  }

  const nextTemplates = templates.some((template) => template.id === parsed.data.id)
    ? templates.map((template) => (template.id === parsed.data.id ? parsed.data : template))
    : [...templates, parsed.data];

  await persistTemplates(nextTemplates, user.id);
  await prisma.activityLog.create({
    data: {
      action: ActivityAction.UPDATE,
      actorId: user.id,
      entityId: parsed.data.id,
      entityType: "official_document_template",
      metadata: toJsonValue({
        category: parsed.data.category,
        isActive: parsed.data.isActive,
        slug: parsed.data.slug,
        title: parsed.data.title,
      }),
      organizationId: user.organizationId,
    },
  });

  revalidatePath("/admin/documents");
  revalidatePath(`/admin/documents/${parsed.data.id}`);

  return {
    message: "Official document template saved.",
    status: "success",
  };
}
