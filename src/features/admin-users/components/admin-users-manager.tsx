"use client";

import { useActionState } from "react";
import { ShieldPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/schemas/auth.schemas";
import type {
  AdminUserActionState,
  AdminUserListItem,
} from "@/features/admin-users/types/admin-user.types";
import { initialAdminUserActionState } from "@/features/admin-users/types/admin-user.types";

type AdminUsersManagerProps = {
  action: (state: AdminUserActionState, formData: FormData) => Promise<AdminUserActionState>;
  admins: AdminUserListItem[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function FormMessage({ state }: { state: AdminUserActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
      {state.message}
    </p>
  );
}

export function AdminUsersManager({ action, admins }: AdminUsersManagerProps) {
  const [state, formAction, isPending] = useActionState(action, initialAdminUserActionState);

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form action={formAction}>
        <Card>
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="bg-accent/15 text-accent-foreground grid size-10 place-items-center rounded-md">
              <ShieldPlus aria-hidden="true" className="size-5" />
            </div>
            <div>
              <CardTitle>Add admin</CardTitle>
              <FieldHint>Create an active admin account for operations staff.</FieldHint>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Apex Operations Admin" required />
              {state.fieldErrors?.name?.[0] ? (
                <FieldError>{state.fieldErrors.name[0]}</FieldError>
              ) : null}
            </Field>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="admin@example.com"
                required
                type="email"
              />
              {state.fieldErrors?.email?.[0] ? (
                <FieldError>{state.fieldErrors.email[0]}</FieldError>
              ) : null}
            </Field>
            <Field>
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" name="password" required type="password" />
              <FieldHint>Password requirements: {PASSWORD_REQUIREMENTS.join(", ")}.</FieldHint>
              {state.fieldErrors?.password?.[0] ? (
                <FieldError>{state.fieldErrors.password[0]}</FieldError>
              ) : null}
            </Field>
            <FormMessage state={state} />
            <Button className="w-full" disabled={isPending} type="submit" variant="accent">
              <ShieldPlus aria-hidden="true" />
              {isPending ? "Creating..." : "Create admin"}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <p className="font-semibold">{admin.name}</p>
                    <p className="text-muted-foreground text-xs">{admin.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{admin.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(admin.createdAt)}</TableCell>
                  <TableCell>{formatDate(admin.lastLoginAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
