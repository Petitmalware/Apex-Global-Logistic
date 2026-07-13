import "server-only";

import { SettingScope, type Prisma } from "@prisma/client";

import { defaultOfficialDocumentTemplates } from "@/features/official-documents/data/default-official-document-templates";
import { officialDocumentTemplateCollectionSchema } from "@/features/official-documents/schemas/official-document.schemas";
import type { OfficialDocumentTemplate } from "@/features/official-documents/types/official-document.types";
import { prisma } from "@/lib/db";

export const OFFICIAL_DOCUMENT_TEMPLATES_SETTING_KEY = "official.document.templates";

function dedupeTemplates(templates: OfficialDocumentTemplate[]) {
  const seen = new Set<string>();

  return templates.filter((template) => {
    const key = template.id || template.slug;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function parseOfficialDocumentTemplates(
  value: Prisma.JsonValue | null,
): OfficialDocumentTemplate[] {
  const parsed = officialDocumentTemplateCollectionSchema.safeParse(value);

  return parsed.success ? parsed.data : defaultOfficialDocumentTemplates;
}

export async function getOfficialDocumentTemplates({
  includeInactive = false,
}: {
  includeInactive?: boolean;
} = {}) {
  try {
    const setting = await prisma.setting.findFirst({
      select: {
        value: true,
      },
      where: {
        key: OFFICIAL_DOCUMENT_TEMPLATES_SETTING_KEY,
        scope: SettingScope.GLOBAL,
      },
    });
    const templates = dedupeTemplates([
      ...parseOfficialDocumentTemplates(setting?.value ?? null),
      ...defaultOfficialDocumentTemplates,
    ]);

    return includeInactive ? templates : templates.filter((template) => template.isActive);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const safeError = error instanceof Error ? { message: error.message, name: error.name } : {};

      console.warn("Unable to load official document templates", safeError);
    }

    return includeInactive
      ? defaultOfficialDocumentTemplates
      : defaultOfficialDocumentTemplates.filter((template) => template.isActive);
  }
}

export async function getOfficialDocumentTemplate(templateId: string) {
  const templates = await getOfficialDocumentTemplates({ includeInactive: true });

  return (
    templates.find((template) => template.id === templateId || template.slug === templateId) ?? null
  );
}
