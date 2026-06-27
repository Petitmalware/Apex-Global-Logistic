import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthError } from "@/lib/auth/errors";

export function getZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid AI request.";
}

export function handleAiRouteError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ message: getZodErrorMessage(error) }, { status: 400 });
  }

  if (error instanceof AuthError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode },
    );
  }

  console.error("AI route failed", error);

  return NextResponse.json({ message: "AI request failed." }, { status: 500 });
}
