"use client";

import { useActionState } from "react";
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

export function VaccinationRecordForm({ action }: { action: RecordAction }) {
  const [state, formAction, isPending] = useActionState(action, initialPetTransportActionState);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <FormMessage state={state} />
      <Field>
        <Label htmlFor="vaccineName">Vaccine</Label>
        <Input id="vaccineName" name="vaccineName" placeholder="Rabies, DHPP, FVRCP..." required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="administeredAt">Administered</Label>
          <Input id="administeredAt" name="administeredAt" type="date" />
        </Field>
        <Field>
          <Label htmlFor="expiresAt">Expires</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="certificateNumber">Certificate number</Label>
        <Input id="certificateNumber" name="certificateNumber" />
      </Field>
      <Field>
        <Label htmlFor="veterinarianName">Veterinarian</Label>
        <Input id="veterinarianName" name="veterinarianName" />
      </Field>
      <Field>
        <Label htmlFor="file">Record file</Label>
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
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <FormMessage state={state} />
      <Field>
        <Label htmlFor="certificateNumber">Certificate number</Label>
        <Input id="certificateNumber" name="certificateNumber" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="issuedAt">Issued</Label>
          <Input id="issuedAt" name="issuedAt" type="date" />
        </Field>
        <Field>
          <Label htmlFor="expiresAt">Expires</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="veterinarianName">Veterinarian</Label>
        <Input id="veterinarianName" name="veterinarianName" />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input name="fitToTravel" type="checkbox" />
        Fit to travel
      </label>
      <Field>
        <Label htmlFor="file">Certificate file</Label>
        <Input accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" id="file" name="file" type="file" />
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
      <Field>
        <Label htmlFor="veterinarianName">Veterinarian</Label>
        <Input id="veterinarianName" name="veterinarianName" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="checkedAt">Checked at</Label>
          <Input
            defaultValue={localDateTimeValue()}
            id="checkedAt"
            name="checkedAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field>
          <Label htmlFor="status">Status</Label>
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
          <Label htmlFor="temperatureC">Temp C</Label>
          <Input id="temperatureC" name="temperatureC" step="0.01" type="number" />
        </Field>
        <Field>
          <Label htmlFor="heartRateBpm">Heart bpm</Label>
          <Input id="heartRateBpm" name="heartRateBpm" min="0" type="number" />
        </Field>
        <Field>
          <Label htmlFor="respirationBpm">Resp bpm</Label>
          <Input id="respirationBpm" name="respirationBpm" min="0" type="number" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
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
      <Field>
        <Label htmlFor="foodType">Food type</Label>
        <Input id="foodType" name="foodType" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="portion">Portion</Label>
          <Input id="portion" name="portion" placeholder="120g, 1 cup..." required />
        </Field>
        <Field>
          <Label htmlFor="frequencyHours">Every hours</Label>
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
        <Label htmlFor="nextFeedingAt">Next feeding</Label>
        <Input id="nextFeedingAt" name="nextFeedingAt" type="datetime-local" />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input defaultChecked name="active" type="checkbox" />
        Active schedule
      </label>
      <Field>
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea id="instructions" name="instructions" />
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="recordedAt">Recorded at</Label>
          <Input
            defaultValue={localDateTimeValue()}
            id="recordedAt"
            name="recordedAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field>
          <Label htmlFor="temperatureC">Temperature C</Label>
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
          <Label htmlFor="crateSensorId">Sensor ID</Label>
          <Input id="crateSensorId" name="crateSensorId" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input name="alertTriggered" type="checkbox" />
        Alert triggered
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
      <Field>
        <Label htmlFor="crateCode">Crate code</Label>
        <Input id="crateCode" name="crateCode" required />
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
          <Label htmlFor="status">Status</Label>
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
          <Label htmlFor="lengthCm">Length cm</Label>
          <Input id="lengthCm" min="0" name="lengthCm" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="widthCm">Width cm</Label>
          <Input id="widthCm" min="0" name="widthCm" step="0.001" type="number" />
        </Field>
        <Field>
          <Label htmlFor="heightCm">Height cm</Label>
          <Input id="heightCm" min="0" name="heightCm" step="0.001" type="number" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-5">
        {[
          ["ventilationChecked", "Ventilation checked"],
          ["waterBowlAttached", "Water attached"],
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
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <FormMessage state={state} />
      <Field>
        <Label htmlFor="file">Pet photo</Label>
        <Input accept=".jpg,.jpeg,.png,.webp" id="file" name="file" required type="file" />
        <FieldHint>JPG, PNG, or WebP. Max size 8MB.</FieldHint>
      </Field>
      <Field>
        <Label htmlFor="caption">Caption</Label>
        <Textarea id="caption" name="caption" placeholder="Condition, crate, or handoff context" />
      </Field>
      <Button disabled={isPending} type="submit" variant="outline">
        <Camera aria-hidden="true" />
        {isPending ? "Uploading..." : "Upload photo"}
      </Button>
    </form>
  );
}
