import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthError, toAuthError } from "@/lib/auth/errors";

function isDevelopment() {
  return process.env.APP_ENV === "development" || process.env.NODE_ENV === "development";
}

function logAuthValidationError(error: ZodError) {
  if (!isDevelopment()) {
    return;
  }

  const flattened = error.flatten();

  console.warn("Auth validation failed", {
    fieldErrors: flattened.fieldErrors,
    formErrors: flattened.formErrors,
  });
}

function logAuthRuntimeError(error: unknown) {
  if (!isDevelopment() || error instanceof AuthError) {
    return;
  }

  const rawMessage = error instanceof Error ? error.message : "Unknown auth error";
  const safeMessage = rawMessage.includes("Can't reach database server")
    ? "Can't reach database server at the configured DATABASE_URL."
    : rawMessage.slice(0, 500);

  console.error("Auth request failed", {
    code:
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined,
    message: safeMessage,
    name: error instanceof Error ? error.name : typeof error,
  });
}

export function authJsonError(error: unknown) {
  if (error instanceof ZodError) {
    logAuthValidationError(error);

    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        errors: error.flatten().fieldErrors,
        message: "Please fix the highlighted fields.",
      },
      { status: 422 },
    );
  }

  logAuthRuntimeError(error);

  const authError = error instanceof AuthError ? error : toAuthError(error);

  return NextResponse.json(
    {
      code: authError.code,
      message: authError.message,
    },
    { status: authError.statusCode },
  );
}
