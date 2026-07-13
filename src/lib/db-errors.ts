export function getRuntimeErrorName(error: unknown) {
  return error instanceof Error
    ? error.name
    : typeof error === "object" && error !== null && "name" in error
      ? String(error.name)
      : "";
}

export function getRuntimeErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

export function isDatabaseUnavailableError(error: unknown) {
  const errorName = getRuntimeErrorName(error);
  const errorCode = getRuntimeErrorCode(error);
  const errorMessage = error instanceof Error ? error.message : "";

  return (
    errorName === "PrismaClientInitializationError" ||
    errorCode === "P1001" ||
    errorMessage.includes("Can't reach database server") ||
    errorMessage.includes("Error in PostgreSQL connection")
  );
}

export function getDatabaseUnavailableMessage() {
  return "The database connection is temporarily unavailable. Please wait a moment and try again.";
}
