import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthError, toAuthError } from "@/lib/auth/errors";

export function authJsonError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        errors: error.flatten().fieldErrors,
        message: "Please check the submitted fields.",
      },
      { status: 422 },
    );
  }

  const authError = error instanceof AuthError ? error : toAuthError(error);

  return NextResponse.json(
    {
      code: authError.code,
      message: authError.message,
    },
    { status: authError.statusCode },
  );
}
