import assert from "node:assert/strict";
import test from "node:test";

import { isPublicPagePath } from "@/lib/auth/public-paths";

test("allows an anonymous customer to open a public tracking receipt", () => {
  assert.equal(isPublicPagePath("/tracking/AGL-202608-ABC12345/receipt"), true);
});

test("does not make unrelated receipt or nested tracking routes public", () => {
  assert.equal(isPublicPagePath("/shipments/shipment-id/receipt"), false);
  assert.equal(isPublicPagePath("/tracking/reference/receipt/edit"), false);
});
