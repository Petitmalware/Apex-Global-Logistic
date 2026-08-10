import assert from "node:assert/strict";
import test from "node:test";

import { formatDateTimeLocalInput, zonedDateTimeToUtc } from "@/lib/time-zone";

test("converts a Halifax shipment time to one UTC instant", () => {
  const instant = zonedDateTimeToUtc("2026-08-10T15:00", "America/Halifax");

  assert.equal(instant.toISOString(), "2026-08-10T18:00:00.000Z");
});

test("the same shipment instant crosses the date boundary in Tokyo", () => {
  const instant = zonedDateTimeToUtc("2026-08-10T15:00", "America/Halifax");

  assert.equal(formatDateTimeLocalInput(instant, "America/New_York"), "2026-08-10T14:00");
  assert.equal(formatDateTimeLocalInput(instant, "Asia/Tokyo"), "2026-08-11T03:00");
});

test("rejects a local time skipped by daylight saving time", () => {
  assert.throws(() => zonedDateTimeToUtc("2026-03-08T02:30", "America/Halifax"), /does not exist/);
});
