"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secureFetch } from "@/lib/security/client-fetch";

type AuthMode = "forgot-password" | "login" | "register" | "reset-password" | "verify-email";

type AuthFormProps = {
  mode: AuthMode;
};

type AuthResponse = {
  code?: string;
  developmentResetToken?: string;
  developmentVerificationToken?: string;
  message?: string;
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

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [developmentToken, setDevelopmentToken] = useState("");

  const requiresEmail = mode === "forgot-password" || mode === "login" || mode === "register";
  const requiresName = mode === "register";
  const requiresPassword = mode === "login" || mode === "register" || mode === "reset-password";
  const requiresToken = mode === "reset-password" || mode === "verify-email";

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
    const payload = (await response.json()) as AuthResponse;

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload.message ?? "Request failed.");
      return;
    }

    if (mode === "login") {
      const searchParams = new URLSearchParams(window.location.search);
      window.location.assign(searchParams.get("next") ?? "/dashboard");
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
            autoComplete="name"
            id="name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>
      ) : null}

      {requiresEmail ? (
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
      ) : null}

      {requiresToken ? (
        <div className="space-y-2">
          <Label htmlFor="token">Token</Label>
          <Input
            autoComplete="one-time-code"
            id="token"
            name="token"
            onChange={(event) => setToken(event.target.value)}
            required
            value={token}
          />
        </div>
      ) : null}

      {requiresPassword ? (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
      ) : null}

      {message ? (
        <p className="border-border bg-secondary text-secondary-foreground rounded-md border px-3 py-2 text-sm">
          {message}
        </p>
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
