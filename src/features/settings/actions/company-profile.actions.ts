"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction, SettingScope, type Prisma } from "@prisma/client";

import { companyProfileSchema } from "@/features/settings/schemas/company-profile.schema";
import {
  COMPANY_PROFILE_SETTING_KEY,
  getCompanyProfile,
} from "@/features/settings/queries/company-profile.queries";
import type { CompanyProfileActionState } from "@/features/settings/types/company-profile";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function updateCompanyProfileAction(
  _previousState: CompanyProfileActionState,
  formData: FormData,
): Promise<CompanyProfileActionState> {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const parsed = companyProfileSchema.safeParse({
    addressLine1: getString(formData, "addressLine1"),
    addressLine2: getString(formData, "addressLine2"),
    businessHours: getString(formData, "businessHours"),
    city: getString(formData, "city"),
    country: getString(formData, "country"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    postalCode: getString(formData, "postalCode"),
    state: getString(formData, "state"),
    taxId: getString(formData, "taxId"),
    website: getString(formData, "website"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please review the company contact details.",
      status: "error",
    };
  }

  const existingSetting = await prisma.setting.findFirst({
    select: {
      id: true,
    },
    where: {
      key: COMPANY_PROFILE_SETTING_KEY,
      scope: SettingScope.GLOBAL,
    },
  });
  const value = toJsonValue(parsed.data);

  if (existingSetting) {
    await prisma.setting.update({
      data: {
        updatedById: user.id,
        value,
      },
      where: {
        id: existingSetting.id,
      },
    });
  } else {
    await prisma.setting.create({
      data: {
        key: COMPANY_PROFILE_SETTING_KEY,
        scope: SettingScope.GLOBAL,
        updatedById: user.id,
        value,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      action: ActivityAction.UPDATE,
      actorId: user.id,
      entityId: COMPANY_PROFILE_SETTING_KEY,
      entityType: "setting",
      metadata: value,
      organizationId: user.organizationId,
    },
  });

  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  revalidatePath("/invoices");
  revalidatePath("/", "layout");

  return {
    message: "Company contact and invoice branding details updated.",
    status: "success",
  };
}

export async function getCompanyProfileForAdmin() {
  await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);

  return getCompanyProfile();
}
