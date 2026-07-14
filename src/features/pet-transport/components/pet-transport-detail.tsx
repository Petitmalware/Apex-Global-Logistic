import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  ClipboardCheck,
  FileText,
  HeartPulse,
  PawPrint,
  Pencil,
  Route as RouteIcon,
  Snowflake,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthSessionUser } from "@/features/auth/services/auth.service";
import {
  addPetCrateAssignmentAction,
  addPetFeedingScheduleAction,
  addPetMedicalCertificateAction,
  addPetTemperatureLogAction,
  addPetVaccinationRecordAction,
  addPetVeterinarianCheckAction,
  uploadPetPhotoAction,
} from "@/features/pet-transport/actions/pet-transport.actions";
import { PetTransportStatusBadge } from "@/features/pet-transport/components/pet-transport-list";
import { kilogramsToPoundsString } from "@/lib/measurements";
import {
  CrateAssignmentForm,
  FeedingScheduleForm,
  MedicalCertificateForm,
  PetPhotoForm,
  TemperatureLogForm,
  VaccinationRecordForm,
  VeterinarianCheckForm,
} from "@/features/pet-transport/components/pet-transport-record-forms";
import type { PetTransportDetail } from "@/features/pet-transport/types";
import { RealtimeShipmentTimeline } from "@/features/shipments/components/realtime-shipment-timeline";
import { ShipmentStatusBadge } from "@/features/shipments/components/shipment-list";
import { AUTH_ROLES } from "@/lib/auth/constants";

function canManagePetTransportWorkspace(user: AuthSessionUser) {
  return user.roles.includes(AUTH_ROLES.ADMIN) || user.roles.includes(AUTH_ROLES.SUPER_ADMIN);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function FactGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div className="border-border bg-surface rounded-lg border p-4" key={item.label}>
          <p className="text-muted-foreground text-xs font-semibold uppercase">{item.label}</p>
          <p className="mt-2 font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function Overview({
  canManage,
  petTransport,
}: {
  canManage: boolean;
  petTransport: PetTransportDetail;
}) {
  return (
    <section className="bg-primary text-primary-foreground shadow-panel overflow-hidden rounded-lg p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
            {petTransport.shipmentNumber}
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-normal md:text-4xl">
            {petTransport.petName ?? "Unnamed pet"} shipment
          </h2>
          <p className="text-primary-foreground/72 mt-3 max-w-2xl text-sm leading-6">
            {petTransport.originCity} to {petTransport.destinationCity} with profile, health, crate,
            feeding, temperature, photo, and shipment tracking records.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <PetTransportStatusBadge status={petTransport.status} />
          <ShipmentStatusBadge status={petTransport.shipmentStatus} />
          <Button
            asChild
            className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15"
            variant="outline"
          >
            <Link href={`/shipments/${petTransport.shipmentId}` as Route}>
              <Truck aria-hidden="true" />
              Shipment
            </Link>
          </Button>
          {canManage ? (
            <Button asChild variant="accent">
              <Link href={`/pet-transport/${petTransport.id}/edit` as Route}>
                <Pencil aria-hidden="true" />
                Edit profile
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Species", value: petTransport.species },
          { label: "Breed", value: petTransport.breed ?? "Not set" },
          {
            label: "Weight",
            value: petTransport.weightKg
              ? `${kilogramsToPoundsString(petTransport.weightKg)} lb`
              : "Not set",
          },
          { label: "Microchip", value: petTransport.microchipNumber ?? "Not set" },
        ].map((item) => (
          <div
            className="border-primary-foreground/15 bg-primary-foreground/8 rounded-lg border p-4"
            key={item.label}
          >
            <p className="text-primary-foreground/60 text-xs font-semibold uppercase">
              {item.label}
            </p>
            <p className="mt-2 font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfileCard({ petTransport }: { petTransport: PetTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
          <PawPrint aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Pet profile</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">Identity, sender, and care context.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <FactGrid
          items={[
            {
              label: "Age",
              value: petTransport.ageMonths ? `${petTransport.ageMonths} months` : "Not set",
            },
            { label: "DOB", value: formatShortDate(petTransport.dateOfBirth) },
            { label: "Sex", value: petTransport.sex ?? "Not set" },
            { label: "Color", value: petTransport.color ?? "Not set" },
            { label: "Sender", value: petTransport.ownerName ?? "Not set" },
            { label: "Sender phone", value: petTransport.ownerPhone ?? "Not set" },
            { label: "Sender email", value: petTransport.ownerEmail ?? "Not set" },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-semibold">Medical handling</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {petTransport.medicationInstructions ??
                petTransport.knownAllergies ??
                "No medication or allergy instructions recorded."}
            </p>
          </div>
          <div>
            <p className="font-semibold">Handler instructions</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {petTransport.handlerInstructions ?? "No special handler instructions recorded."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthPanel({ petTransport }: { petTransport: PetTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-success/10 text-success grid size-10 place-items-center rounded-md">
          <HeartPulse aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Health records</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Vaccinations, medical certificates, and veterinarian checks.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold">Vaccination records</h3>
          <div className="mt-3 space-y-3">
            {petTransport.vaccinationRecords.length ? (
              petTransport.vaccinationRecords.map((record) => (
                <div className="border-border rounded-lg border p-3" key={record.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{record.vaccineName}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Expires {formatShortDate(record.expiresAt)}
                        {record.veterinarianName ? ` - ${record.veterinarianName}` : ""}
                      </p>
                    </div>
                    <Badge variant={record.verifiedAt ? "success" : "outline"}>
                      {record.verifiedAt ? "Verified" : "Recorded"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No vaccination records yet.</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Medical certificates</h3>
          <div className="mt-3 space-y-3">
            {petTransport.medicalCertificates.length ? (
              petTransport.medicalCertificates.map((certificate) => (
                <div className="border-border rounded-lg border p-3" key={certificate.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{certificate.certificateNumber}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Issued {formatShortDate(certificate.issuedAt)} - expires{" "}
                        {formatShortDate(certificate.expiresAt)}
                      </p>
                    </div>
                    <Badge variant={certificate.fitToTravel ? "success" : "warning"}>
                      {certificate.fitToTravel ? "Fit to travel" : "Review"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No medical certificates yet.</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Veterinarian checks</h3>
          <div className="mt-3 space-y-3">
            {petTransport.veterinarianChecks.length ? (
              petTransport.veterinarianChecks.map((check) => (
                <div className="border-border rounded-lg border p-3" key={check.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{check.veterinarianName}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDate(check.checkedAt)}
                        {check.temperatureC ? ` - ${check.temperatureC} C` : ""}
                      </p>
                    </div>
                    <Badge variant={check.status === "CLEARED" ? "success" : "outline"}>
                      {check.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No veterinarian checks yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CrateAndCarePanel({ petTransport }: { petTransport: PetTransportDetail }) {
  const latestCrate = petTransport.crateAssignments[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-warning/15 text-warning-foreground grid size-10 place-items-center rounded-md">
          <ClipboardCheck aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Crate and feeding</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Crate assignment and active care plan.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FactGrid
          items={[
            { label: "Crate", value: latestCrate?.crateCode ?? "Not assigned" },
            { label: "Crate status", value: latestCrate?.status.replaceAll("_", " ") ?? "Not set" },
            {
              label: "Crate dims",
              value:
                petTransport.crateLengthCm &&
                petTransport.crateWidthCm &&
                petTransport.crateHeightCm
                  ? `${petTransport.crateLengthCm} x ${petTransport.crateWidthCm} x ${petTransport.crateHeightCm} cm`
                  : "Not set",
            },
          ]}
        />
        <div>
          <h3 className="text-sm font-semibold">Feeding schedules</h3>
          <div className="mt-3 space-y-3">
            {petTransport.feedingSchedules.length ? (
              petTransport.feedingSchedules.map((schedule) => (
                <div className="border-border rounded-lg border p-3" key={schedule.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{schedule.foodType}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {schedule.portion} every {schedule.frequencyHours} hours - next{" "}
                        {formatDate(schedule.nextFeedingAt)}
                      </p>
                    </div>
                    <Badge variant={schedule.active ? "success" : "outline"}>
                      {schedule.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No feeding schedules yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemperaturePanel({ petTransport }: { petTransport: PetTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-info/10 text-info grid size-10 place-items-center rounded-md">
          <Snowflake aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Temperature logs</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Crate and handling environment history.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {petTransport.temperatureLogs.length ? (
          petTransport.temperatureLogs.map((log) => (
            <div className="border-border rounded-lg border p-3" key={log.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{log.temperatureC} C</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDate(log.recordedAt)}
                    {log.location ? ` - ${log.location}` : ""}
                  </p>
                </div>
                <Badge variant={log.alertTriggered ? "danger" : "success"}>
                  {log.alertTriggered ? "Alert" : "Normal"}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No temperature logs yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function PhotosPanel({
  canManage,
  petTransport,
}: {
  canManage: boolean;
  petTransport: PetTransportDetail;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-secondary text-secondary-foreground grid size-10 place-items-center rounded-md">
          <FileText aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Pet photos</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Profile, crate, and handoff evidence.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManage ? (
          <PetPhotoForm action={uploadPetPhotoAction.bind(null, petTransport.id)} />
        ) : null}
        {petTransport.photos.length ? (
          <div className="grid grid-cols-2 gap-3">
            {petTransport.photos.map((photo) => (
              <figure className="min-w-0" key={photo.id}>
                <Image
                  alt={photo.caption ?? `Photo for ${petTransport.petName ?? "pet"}`}
                  className="border-border aspect-[4/3] w-full rounded-md border object-cover"
                  height={180}
                  sizes="(min-width: 640px) 240px, 50vw"
                  src={`/pet-transport/${petTransport.id}/photos/${photo.id}`}
                  unoptimized
                  width={240}
                />
                <figcaption className="text-muted-foreground mt-1 truncate text-xs">
                  {photo.caption ?? photo.fileName}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No pet photos uploaded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function TimelinePanel({ petTransport }: { petTransport: PetTransportDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
          <RouteIcon aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Travel history</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Pet-specific events followed by shipment tracking events.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {petTransport.travelHistory.map((event) => (
            <div className="flex gap-4" key={event.id}>
              <div className="flex flex-col items-center">
                <span className="bg-accent size-3 rounded-full" />
                <span className="bg-border mt-2 h-full w-px" />
              </div>
              <div className="min-w-0 flex-1 pb-4">
                <p className="font-semibold">{event.eventType.replaceAll("_", " ")}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDate(event.occurredAt)}
                  {event.location ? ` - ${event.location}` : ""}
                </p>
                {event.message ? <p className="mt-2 text-sm leading-6">{event.message}</p> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="border-border border-t pt-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Activity aria-hidden="true" className="text-accent size-4" />
            Shipment tracking
          </h3>
          <RealtimeShipmentTimeline
            initialTimeline={petTransport.shipmentTimeline}
            shipmentId={petTransport.shipmentId}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RecordForms({ petTransport }: { petTransport: PetTransportDetail }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vaccination record</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Save vaccine proof, clinic references, and expiry dates used for travel clearance.
          </p>
        </CardHeader>
        <CardContent>
          <VaccinationRecordForm
            action={addPetVaccinationRecordAction.bind(null, petTransport.id)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Fit-to-travel certificate</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Record the health certificate or CVI that confirms this pet can continue transport.
          </p>
        </CardHeader>
        <CardContent>
          <MedicalCertificateForm
            action={addPetMedicalCertificateAction.bind(null, petTransport.id)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Veterinarian check</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Log clinic checks, welfare inspections, vitals, and route clearance decisions.
          </p>
        </CardHeader>
        <CardContent>
          <VeterinarianCheckForm
            action={addPetVeterinarianCheckAction.bind(null, petTransport.id)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Feeding schedule</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Set the food, portion, timing, and care notes handlers should follow in transit.
          </p>
        </CardHeader>
        <CardContent>
          <FeedingScheduleForm action={addPetFeedingScheduleAction.bind(null, petTransport.id)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Temperature log</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Record crate, sensor, or facility temperature checks during each travel stage.
          </p>
        </CardHeader>
        <CardContent>
          <TemperatureLogForm action={addPetTemperatureLogAction.bind(null, petTransport.id)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Crate assignment</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Assign the travel crate and confirm ventilation, water, lining, and dimensions.
          </p>
        </CardHeader>
        <CardContent>
          <CrateAssignmentForm action={addPetCrateAssignmentAction.bind(null, petTransport.id)} />
        </CardContent>
      </Card>
      <PhotosPanel canManage petTransport={petTransport} />
    </div>
  );
}

function CustomerPetAccessPanel() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="bg-success/10 text-success grid size-10 place-items-center rounded-md">
          <ClipboardCheck aria-hidden="true" className="size-5" />
        </div>
        <div>
          <CardTitle>Customer access</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Apex operations manages care records and route updates.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-6">
          You can review pet profile details, medical milestones, crate and feeding records,
          temperature logs, photos, travel history, and shipment tracking. New records are added by
          the Apex admin team.
        </p>
      </CardContent>
    </Card>
  );
}

export function PetTransportDetailView({
  petTransport,
  user,
}: {
  petTransport: PetTransportDetail;
  user: AuthSessionUser;
}) {
  const canManage = canManagePetTransportWorkspace(user);

  return (
    <div className="space-y-6">
      <Overview canManage={canManage} petTransport={petTransport} />
      <ProfileCard petTransport={petTransport} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <HealthPanel petTransport={petTransport} />
          <CrateAndCarePanel petTransport={petTransport} />
          <TemperaturePanel petTransport={petTransport} />
          <TimelinePanel petTransport={petTransport} />
        </div>
        {canManage ? (
          <RecordForms petTransport={petTransport} />
        ) : (
          <div className="space-y-6">
            <CustomerPetAccessPanel />
            <PhotosPanel canManage={false} petTransport={petTransport} />
          </div>
        )}
      </div>
    </div>
  );
}
