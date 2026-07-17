import {
  BadgeCheck,
  Building2,
  Clock3,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyProfileInput } from "@/features/settings/schemas/company-profile.schema";

function getAddressLines(profile: CompanyProfileInput) {
  return [
    profile.addressLine1,
    profile.addressLine2,
    [profile.city, profile.state, profile.postalCode].filter(Boolean).join(", "),
    profile.country,
  ].filter((line): line is string => Boolean(line));
}

export function hasCompanyContactDetails(profile: CompanyProfileInput) {
  return Boolean(
    profile.email ||
    profile.phone ||
    profile.website ||
    profile.businessHours ||
    getAddressLines(profile).length,
  );
}

export function hasCompanyBusinessIdentity(profile: CompanyProfileInput) {
  return Boolean(
    profile.legalName ||
    profile.registrationNumber ||
    profile.registrationAuthority ||
    profile.registrationJurisdiction ||
    profile.carrierLicenseNumber ||
    profile.businessRegistryUrl,
  );
}

export function CompanyBusinessIdentity({ profile }: { profile: CompanyProfileInput }) {
  if (!hasCompanyBusinessIdentity(profile)) {
    return null;
  }

  const items = [
    profile.legalName ? { label: "Registered legal name", value: profile.legalName } : null,
    profile.registrationNumber
      ? { label: "Registration number", value: profile.registrationNumber }
      : null,
    profile.registrationAuthority
      ? { label: "Registration authority", value: profile.registrationAuthority }
      : null,
    profile.registrationJurisdiction
      ? { label: "Jurisdiction", value: profile.registrationJurisdiction }
      : null,
    profile.carrierLicenseNumber
      ? { label: "Regulatory or carrier ID", value: profile.carrierLicenseNumber }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
            <BadgeCheck aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle>Business registration details</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Published company identity details for independent customer verification.
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div className="border-border bg-surface rounded-lg border p-4" key={item.label}>
              <p className="text-muted-foreground text-xs font-semibold uppercase">{item.label}</p>
              <p className="mt-2 font-semibold">{item.value}</p>
            </div>
          ))}
          {profile.businessRegistryUrl ? (
            <a
              className="border-border bg-surface hover:bg-secondary flex items-center justify-between gap-3 rounded-lg border p-4 font-semibold"
              href={profile.businessRegistryUrl}
              rel="noreferrer"
              target="_blank"
            >
              Verify with the official registry
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

export function CompanyContactDetails({ profile }: { profile: CompanyProfileInput }) {
  const addressLines = getAddressLines(profile);
  const items = [
    profile.email
      ? {
          icon: Mail,
          label: "Email",
          value: profile.email,
        }
      : null,
    profile.phone
      ? {
          icon: Phone,
          label: "Phone",
          value: profile.phone,
        }
      : null,
    profile.website
      ? {
          icon: Globe2,
          label: "Website",
          value: profile.website,
        }
      : null,
    profile.businessHours
      ? {
          icon: Clock3,
          label: "Hours",
          value: profile.businessHours,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (!hasCompanyContactDetails(profile)) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
            <Building2 aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle>Apex Global Logistics contact details</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Current public company information maintained by the admin team.
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {addressLines.length ? (
            <div className="border-border bg-surface rounded-lg border p-4">
              <MapPin aria-hidden="true" className="text-accent size-5" />
              <p className="mt-3 font-semibold">Address</p>
              <div className="text-muted-foreground mt-2 space-y-1 text-sm leading-6">
                {addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          ) : null}
          {items.map((item) => (
            <div className="border-border bg-surface rounded-lg border p-4" key={item.label}>
              <item.icon aria-hidden="true" className="text-accent size-5" />
              <p className="mt-3 font-semibold">{item.label}</p>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
