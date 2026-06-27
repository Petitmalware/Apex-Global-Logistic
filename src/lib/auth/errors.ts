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

export function toAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return error;
  }

  return new AuthError("Authentication request failed.", 500, "AUTH_UNKNOWN");
}
