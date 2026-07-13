"use client";

import { useActionState, type ReactNode } from "react";
import { Camera, ClipboardCheck, FilePlus2, HeartPulse, Snowflake, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PetTransportActionState } from "@/features/pet-transport/types";
import { initialPetTransportActionState } from "@/features/pet-transport/types";

type RecordAction = (
  state: PetTransportActionState,
  formData: FormData,
) => Promise<PetTransportActionState>;

function localDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toISOString().slice(0, 16);
}

function FormMessage({ state }: { state: PetTransportActionState }) {
  return state.message ? (
    <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
      {state.message}
    </p>
  ) : null;
}

function FormIntro({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm leading-6">{children}</p>;
}

export function VaccinationRecordForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <FormIntro>
        Add vaccine proof exactly as it appears on the clinic record. Upload the file when available
        so the health history can be reviewed later.
      </FormIntro>
      <Field>
        <Label htmlFor="vaccineName">Vaccine name</Label>
        <Input id="vaccineName" name="vaccineName" placeholder="Rabies, DHPP, FVRCP..." required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="administeredAt">Date administered</Label>
          <Input id="administeredAt" name="administeredAt" type="date" />
        </Field>
        <Field>
          <Label htmlFor="expiresAt">Expiration date</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="certificateNumber">Record or certificate number</Label>
        <Input id="certificateNumber" name="certificateNumber" placeholder="Optional clinic ref" />
      </Field>
      <Field>
        <Label htmlFor="veterinarianName">Vet or clinic contact</Label>
        <Input id="veterinarianName" name="veterinarianName" placeholder="Clinic or veterinarian" />
      </Field>
      <Field>
        <Label htmlFor="file">Vaccination record file</Label>
        <Input accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" id="file" name="file" type="file" />
        <FieldHint>Optional PDF, image, or text record. Max size 10MB.</FieldHint>
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <FilePlus2 aria-hidden="true" />
        {isPending ? "Adding..." : "Add vaccination"}
      </Button>
    </form>
  );
}

export function MedicalCertificateForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <FormIntro>
        Record the official fit-to-travel or health certificate used for route clearance.
      </FormIntro>
      <Field>
        <Label htmlFor="certificateNumber">Medical certificate number</Label>
        <Input
          id="certificateNumber"
          name="certificateNumber"
          placeholder="USDA CVI, airline health certificate..."
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="issuedAt">Issue date</Label>
          <Input id="issuedAt" name="issuedAt" type="date" />
        </Field>
        <Field>
          <Label htmlFor="expiresAt">Expiration date</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="veterinarianName">Issuing vet or clinic</Label>
        <Input id="veterinarianName" name="veterinarianName" />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input name="fitToTravel" type="checkbox" />
        Mark as fit to travel
      </label>
      <Field>
        <Label htmlFor="file">Health certificate file</Label>
        <Input accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" id="file" name="file" type="file" />
        <FieldHint>Upload the signed certificate or clearance document when available.</FieldHint>
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <ClipboardCheck aria-hidden="true" />
        {isPending ? "Adding..." : "Add certificate"}
      </Button>
    </form>
  );
}

export function VeterinarianCheckForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <FormIntro>
        Add each professional check or checkpoint welfare inspection so handlers and customers can
        see that the pet remains cleared for transport.
      </FormIntro>
      <Field>
        <Label htmlFor="veterinarianName">Veterinarian or clinic</Label>
        <Input
          id="veterinarianName"
          name="veterinarianName"
          placeholder="Clinic, vet, or inspector"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="checkedAt">Check completed at</Label>
          <Input
            defaultValue={localDateTimeValue()}
            id="checkedAt"
            name="checkedAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field>
          <Label htmlFor="status">Vet check result</Label>
          <Select defaultValue="CLEARED" id="status" name="status">
            <option value="SCHEDULED">Scheduled</option>
            <option value="CLEARED">Cleared</option>
            <option value="MONITORING">Monitoring</option>
            <option value="NOT_CLEARED">Not cleared</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="temperatureC">Body temperature (C)</Label>
          <Input id="temperatureC" name="temperatureC" step="0.01" type="number" />
        </Field>
        <Field>
          <Label htmlFor="heartRateBpm">Heart rate (bpm)</Label>
          <Input id="heartRateBpm" name="heartRateBpm" min="0" type="number" />
        </Field>
        <Field>
          <Label htmlFor="respirationBpm">Respiration (breaths/min)</Label>
          <Input id="respirationBpm" name="respirationBpm" min="0" type="number" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="notes">Care notes for handler/customer</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Normal check, hydrated, cleared for next leg..."
        />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <HeartPulse aria-hidden="true" />
        {isPending ? "Adding..." : "Add vet check"}
      </Button>
    </form>
  );
}

export function FeedingScheduleForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <FormIntro>
        Define the feeding plan handlers should follow during holding, layovers, or long-distance
        ground transport.
      </FormIntro>
      <Field>
        <Label htmlFor="foodType">Food or diet type</Label>
        <Input
          id="foodType"
          name="foodType"
          placeholder="Dry puppy food, wet food, breeder-provided food..."
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="portion">Portion</Label>
          <Input id="portion" name="portion" placeholder="120g, 1 cup..." required />
        </Field>
        <Field>
          <Label htmlFor="frequencyHours">Feed every (hours)</Label>
          <Input
            defaultValue="8"
            id="frequencyHours"
            min="1"
            name="frequencyHours"
            required
            type="number"
          />
        </Field>
      </div>
      <Field>
        <Label htmlFor="nextFeedingAt">Next feeding due</Label>
        <Input id="nextFeedingAt" name="nextFeedingAt" type="datetime-local" />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input defaultChecked name="active" type="checkbox" />
        Schedule is active
      </label>
      <Field>
        <Label htmlFor="instructions">Feeding instructions</Label>
        <Textarea
          id="instructions"
          name="instructions"
          placeholder="Water access, food restrictions, comfort notes..."
        />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <Utensils aria-hidden="true" />
        {isPending ? "Adding..." : "Add feeding"}
      </Button>
    </form>
  );
}

export function TemperatureLogForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <FormIntro>
        Record crate or holding-area temperature whenever the pet changes location or a sensor is
        checked manually.
      </FormIntro>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="recordedAt">Temperature recorded at</Label>
          <Input
            defaultValue={localDateTimeValue()}
            id="recordedAt"
            name="recordedAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field>
          <Label htmlFor="temperatureC">Temperature (C)</Label>
          <Input id="temperatureC" name="temperatureC" required step="0.01" type="number" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="humidityPercent">Humidity %</Label>
          <Input
            id="humidityPercent"
            name="humidityPercent"
            max="100"
            min="0"
            step="0.01"
            type="number"
          />
        </Field>
        <Field>
          <Label htmlFor="crateSensorId">Crate sensor ID</Label>
          <Input
            id="crateSensorId"
            name="crateSensorId"
            placeholder="Optional sensor or device ID"
          />
        </Field>
      </div>
      <Field>
        <Label htmlFor="location">Checkpoint or facility</Label>
        <Input
          id="location"
          name="location"
          placeholder="Airport animal lounge, driver checkpoint..."
        />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input name="alertTriggered" type="checkbox" />
        Temperature alert triggered
      </label>
      <Button disabled={isPending} type="submit" variant="outline">
        <Snowflake aria-hidden="true" />
        {isPending ? "Adding..." : "Add temperature"}
      </Button>
    </form>
  );
}

export function CrateAssignmentForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <FormIntro>
        Assign the transport crate and record the safety checks that make it ready for travel.
      </FormIntro>
      <Field>
        <Label htmlFor="crateCode">Internal crate code</Label>
        <Input id="crateCode" name="crateCode" placeholder="CRATE-AGL-1024" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="assignedAt">Assigned at</Label>
          <Input
            defaultValue={localDateTimeValue()}
            id="assignedAt"
            name="assignedAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field>
          <Label htmlFor="status">Crate handling status</Label>
          <Select defaultValue="ASSIGNED" id="status" name="status">
            <option value="ASSIGNED">Assigned</option>
            <option value="INSPECTED">Inspected</option>
            <option value="LOADED">Loaded</option>
            <option value="RELEASED">Released</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="lengthCm">Crate length (cm)</Label>
          <Input id="lengthCm" min="0" name="lengthCm" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="widthCm">Crate width (cm)</Label>
          <Input id="widthCm" min="0" name="widthCm" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="heightCm">Crate height (cm)</Label>
          <Input id="heightCm" min="0" name="heightCm" step="0.001" type="number" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-5">
        {[
          ["ventilationChecked", "Ventilation checked"],
          ["waterBowlAttached", "Water bowl attached"],
          ["absorbentLining", "Absorbent lining"],
        ].map(([name, label]) => (
          <label className="flex items-center gap-2 text-sm font-medium" key={name}>
            <input name={name} type="checkbox" />
            {label}
          </label>
        ))}
      </div>
      <Button disabled={isPending} type="submit" variant="outline">
        <ClipboardCheck aria-hidden="true" />
        {isPending ? "Assigning..." : "Assign crate"}
      </Button>
    </form>
  );
}

export function PetPhotoForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <FormIntro>
        Upload profile, crate, checkpoint, or handoff photos that help prove condition and delivery
        progress.
      </FormIntro>
      <Field>
        <Label htmlFor="file">Pet photo or handoff proof</Label>
        <Input accept=".jpg,.jpeg,.png,.webp" id="file" name="file" required type="file" />
        <FieldHint>JPG, PNG, or WebP. Max size 8MB.</FieldHint>
      </Field>
      <Field>
        <Label htmlFor="caption">Photo caption</Label>
        <Textarea id="caption" name="caption" placeholder="Condition, crate, or handoff context" />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <Camera aria-hidden="true" />
        {isPending ? "Uploading..." : "Upload photo"}
      </Button>
    </form>
  );
}
