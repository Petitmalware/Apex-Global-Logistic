import "server-only";

import { SettingScope, type Prisma } from "@prisma/client";

import {
  companyProfileSchema,
  type CompanyProfileInput,
} from "@/features/settings/schemas/company-profile.schema";
import { prisma } from "@/lib/db";

export const COMPANY_PROFILE_SETTING_KEY = "company.profile";

export const defaultCompanyProfile: CompanyProfileInput = {};

export function parseCompanyProfile(value: Prisma.JsonValue | null): CompanyProfileInput {
  const parsed = companyProfileSchema.safeParse(value);

  return parsed.success ? parsed.data : defaultCompanyProfile;
}

export async function getCompanyProfile() {
  try {
    const setting = await prisma.setting.findFirst({
      select: {
        value: true,
      },
      where: {
        key: COMPANY_PROFILE_SETTING_KEY,
        scope: SettingScope.GLOBAL,
      },
    });

    return parseCompanyProfile(setting?.value ?? null);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const safeError = error instanceof Error ? { message: error.message, name: error.name } : {};

      console.warn("Unable to load company profile settings", safeError);
    }

    return defaultCompanyProfile;
  }
}
