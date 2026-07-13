export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly code = "AUTH_ERROR",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function getRuntimeErrorName(error: unknown) {
  return error instanceof Error
    ? error.name
    : typeof error === "object" && error !== null && "name" in error
      ? String(error.name)
      : "";
}

function getRuntimeErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

function isDatabaseUnavailableError(error: unknown) {
  const errorName = getRuntimeErrorName(error);
  const errorCode = getRuntimeErrorCode(error);

  return errorName === "PrismaClientInitializationError" || errorCode === "P1001";
}

export function toAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return error;
  }

  if (isDatabaseUnavailableError(error)) {
    return new AuthError(
      "Authentication service is temporarily unavailable because the database cannot be reached.",
      503,
      "DATABASE_UNAVAILABLE",
    );
  }

  return new AuthError("Authentication request failed.", 500, "AUTH_UNKNOWN");
}
