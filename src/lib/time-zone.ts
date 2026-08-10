const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

type DateTimeParts = {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
};

function getDateTimeParts(value: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(value);
  const record = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    day: Number(record.day),
    hour: Number(record.hour),
    minute: Number(record.minute),
    month: Number(record.month),
    second: Number(record.second),
    year: Number(record.year),
  };
}

function parseLocalDateTime(value: string): DateTimeParts {
  const match = localDateTimePattern.exec(value);

  if (!match) {
    throw new RangeError("Enter a valid local date and time.");
  }

  const parts = {
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    month: Number(match[2]),
    second: Number(match[6] ?? 0),
    year: Number(match[1]),
  };
  const validationDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
  );

  if (
    validationDate.getUTCFullYear() !== parts.year ||
    validationDate.getUTCMonth() + 1 !== parts.month ||
    validationDate.getUTCDate() !== parts.day ||
    validationDate.getUTCHours() !== parts.hour ||
    validationDate.getUTCMinutes() !== parts.minute ||
    validationDate.getUTCSeconds() !== parts.second
  ) {
    throw new RangeError("Enter a valid local date and time.");
  }

  return parts;
}

function partsMatch(first: DateTimeParts, second: DateTimeParts) {
  return (
    first.year === second.year &&
    first.month === second.month &&
    first.day === second.day &&
    first.hour === second.hour &&
    first.minute === second.minute &&
    first.second === second.second
  );
}

function getTimeZoneOffsetMilliseconds(value: Date, timeZone: string) {
  const parts = getDateTimeParts(value, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return zonedAsUtc - Math.floor(value.getTime() / 1000) * 1000;
}

export function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

/**
 * Interprets an HTML datetime-local value in an IANA time zone and returns the
 * corresponding UTC instant. Non-existent local times during a DST jump are
 * rejected instead of being silently shifted.
 */
export function zonedDateTimeToUtc(value: string, timeZone: string) {
  if (!isValidTimeZone(timeZone)) {
    throw new RangeError("Select a valid time zone.");
  }

  const localParts = parseLocalDateTime(value);
  const localAsUtc = Date.UTC(
    localParts.year,
    localParts.month - 1,
    localParts.day,
    localParts.hour,
    localParts.minute,
    localParts.second,
  );
  let candidate = new Date(localAsUtc);

  // Recalculate once after applying the first offset so dates around daylight
  // saving transitions use the offset that applies to the resulting instant.
  for (let index = 0; index < 2; index += 1) {
    const offset = getTimeZoneOffsetMilliseconds(candidate, timeZone);
    candidate = new Date(localAsUtc - offset);
  }

  if (!partsMatch(getDateTimeParts(candidate, timeZone), localParts)) {
    throw new RangeError("That local time does not exist in the selected time zone.");
  }

  return candidate;
}

export function formatDateTimeLocalInput(value: string | Date, timeZone: string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime()) || !isValidTimeZone(timeZone)) {
    return "";
  }

  const parts = getDateTimeParts(date, timeZone);
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}
