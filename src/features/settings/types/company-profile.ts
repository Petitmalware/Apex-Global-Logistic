import type { CompanyProfileInput } from "@/features/settings/schemas/company-profile.schema";

export type CompanyProfile = CompanyProfileInput;

export type CompanyProfileActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialCompanyProfileActionState: CompanyProfileActionState = {
  status: "idle",
};
