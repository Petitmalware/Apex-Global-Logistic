"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_REQUIREMENTS } from "@/features/auth/schemas/auth.schemas";
import { secureFetch } from "@/lib/security/client-fetch";

type AuthMode = "forgot-password" | "login" | "register" | "reset-password" | "verify-email";

type AuthFormProps = {
  mode: AuthMode;
};

type AuthResponse = {
  code?: string;
  developmentResetToken?: string;
  developmentVerificationToken?: string;
  errors?: Record<string, string[] | undefined>;
  message?: string;
  user?: {
    roles?: string[];
  };
};

type AuthField = "email" | "name" | "password" | "token";
type FieldErrors = Partial<Record<AuthField, string[]>>;

const fieldLabels: Record<AuthField, string> = {
  email: "Email",
  name: "Name",
  password: "Password",
  token: "Token",
};

const endpoints: Record<AuthMode, string> = {
  "forgot-password": "/api/auth/forgot-password",
  login: "/api/auth/login",
  register: "/api/auth/register",
  "reset-password": "/api/auth/reset-password",
  "verify-email": "/api/auth/verify-email",
};

const submitLabels: Record<AuthMode, string> = {
  "forgot-password": "Send reset link",
  login: "Sign in",
  register: "Create account",
  "reset-password": "Reset password",
  "verify-email": "Verify email",
};

function getPostLoginHref(payload: AuthResponse) {
  const roles = payload.user?.roles ?? [];

  if (roles.includes("super_admin")) {
    return "/admin";
  }

  if (roles.includes("admin")) {
    return "/admin";
  }

  return "/customer";
}

function getSafePostLoginHref(value: string | null, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function normalizeFieldErrors(errors: AuthResponse["errors"]): FieldErrors {
  if (!errors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors)
      .filter(
        (entry): entry is [AuthField, string[]] =>
          entry[0] in fieldLabels && Array.isArray(entry[1]) && entry[1].length > 0,
      )
      .map(([field, messages]) => [field, messages.filter(Boolean)]),
  );
}

function getValidationMessages(errors: FieldErrors) {
  return Object.entries(errors).flatMap(([field, messages]) =>
    (messages ?? []).map((validationMessage) => {
      if (
        validationMessage.toLowerCase().startsWith(fieldLabels[field as AuthField].toLowerCase())
      ) {
        return validationMessage;
      }

      return `${fieldLabels[field as AuthField]}: ${validationMessage}`;
    }),
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [developmentToken, setDevelopmentToken] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const requiresEmail = mode === "forgot-password" || mode === "login" || mode === "register";
  const requiresName = mode === "register";
  const requiresPassword = mode === "login" || mode === "register" || mode === "reset-password";
  const requiresToken = mode === "reset-password" || mode === "verify-email";
  const showsPasswordRequirements = mode === "register" || mode === "reset-password";
  const validationMessages = getValidationMessages(fieldErrors);

  const secondaryLink = useMemo<{ href: Route; label: string }>(() => {
    if (mode === "login") {
      return { href: "/forgot-password", label: "Forgot password" };
    }

    if (mode === "register") {
      return { href: "/login", label: "Sign in" };
    }

    return { href: "/login", label: "Back to sign in" };
  }, [mode]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = searchParams.get("token");

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setDevelopmentToken("");
    setFieldErrors({});

    const body: Record<string, string> = {};

    if (requiresEmail) {
      body.email = email;
    }

    if (requiresName) {
      body.name = name;
    }

    if (requiresPassword) {
      body.password = password;
    }

    if (requiresToken) {
      body.token = token;
    }

    const response = await secureFetch(endpoints[mode], {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as AuthResponse;

    setIsSubmitting(false);

    if (!response.ok) {
      const nextFieldErrors = normalizeFieldErrors(payload.errors);
      const nextValidationMessages = getValidationMessages(nextFieldErrors);

      setFieldErrors(nextFieldErrors);
      setMessage(
        nextValidationMessages.length
          ? "Please fix the highlighted fields."
          : (payload.message ?? "Request failed."),
      );
      return;
    }

    if (mode === "login") {
      const searchParams = new URLSearchParams(window.location.search);
      const fallbackHref = getPostLoginHref(payload);

      window.location.assign(getSafePostLoginHref(searchParams.get("next"), fallbackHref));
      return;
    }

    setMessage(payload.message ?? "Request successful.");
    setDevelopmentToken(
      payload.developmentResetToken ?? payload.developmentVerificationToken ?? "",
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {requiresName ? (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            aria-describedby={fieldErrors.name?.length ? "name-error" : undefined}
            aria-invalid={fieldErrors.name?.length ? true : undefined}
            autoComplete="name"
            id="name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          {fieldErrors.name?.length ? (
            <p className="text-destructive text-sm" id="name-error">
              {fieldErrors.name.join(" ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {requiresEmail ? (
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            aria-describedby={fieldErrors.email?.length ? "email-error" : undefined}
            aria-invalid={fieldErrors.email?.length ? true : undefined}
            autoComplete="email"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          {fieldErrors.email?.length ? (
            <p className="text-destructive text-sm" id="email-error">
              {fieldErrors.email.join(" ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {requiresToken ? (
        <div className="space-y-2">
          <Label htmlFor="token">Token</Label>
          <Input
            aria-describedby={fieldErrors.token?.length ? "token-error" : undefined}
            aria-invalid={fieldErrors.token?.length ? true : undefined}
            autoComplete="one-time-code"
            id="token"
            name="token"
            onChange={(event) => setToken(event.target.value)}
            required
            value={token}
          />
          {fieldErrors.token?.length ? (
            <p className="text-destructive text-sm" id="token-error">
              {fieldErrors.token.join(" ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {requiresPassword ? (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            aria-describedby={
              [
                showsPasswordRequirements ? "password-requirements" : null,
                fieldErrors.password?.length ? "password-error" : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={fieldErrors.password?.length ? true : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            id="password"
            maxLength={mode === "login" ? undefined : 128}
            minLength={mode === "login" ? undefined : 12}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {showsPasswordRequirements ? (
            <p className="text-muted-foreground text-xs" id="password-requirements">
              Password requirements: {PASSWORD_REQUIREMENTS.join(", ")}.
            </p>
          ) : null}
          {fieldErrors.password?.length ? (
            <p className="text-destructive text-sm" id="password-error">
              {fieldErrors.password.join(" ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <div
          className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm"
          role="alert"
        >
          <p>{message}</p>
          {validationMessages.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationMessages.map((validationMessage) => (
                <li key={validationMessage}>{validationMessage}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {developmentToken ? (
        <p className="border-border bg-background text-muted-foreground rounded-md border px-3 py-2 text-xs break-all">
          Development token: {developmentToken}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Working..." : submitLabels[mode]}
        </Button>
        <Link
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
          href={secondaryLink.href}
        >
          {secondaryLink.label}
        </Link>
      </div>
    </form>
  );
}
