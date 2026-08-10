"use client";

import { useEffect, useState } from "react";

type LocalizedDateTimeProps = {
  fallback?: string;
  value: string | null;
};

function formatDateTime(value: string, timeZone?: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

export function LocalizedDateTime({ fallback = "Not scheduled", value }: LocalizedDateTimeProps) {
  const [formatted, setFormatted] = useState(() => (value ? formatDateTime(value, "UTC") : null));

  useEffect(() => {
    setFormatted(value ? formatDateTime(value) : null);
  }, [value]);

  if (!value || !formatted) {
    return fallback;
  }

  return (
    <time dateTime={value} suppressHydrationWarning>
      {formatted}
    </time>
  );
}
