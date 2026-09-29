import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";

// Isolate route dependencies: no live database, SMTP connection, or provider request.
function loadModule(path, mocks, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require(id) {
      if (!(id in mocks)) throw new Error(`Unexpected dependency: ${id}`);
      return mocks[id];
    },
    console: { error() {} },
    ...globals,
  });
  return exports;
}

const common = {
  "next/server": {
    NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) },
  },
  "@/lib/auth/session": { requireRole: async () => ({ id: "admin" }) },
  "@/lib/auth/constants": { AUTH_ROLES: { ADMIN: "ADMIN", SUPER_ADMIN: "SUPER_ADMIN" } },
};
const request = (body) => ({ json: async () => body });

test("invoice API uses the real Prisma client and schema fields", async () => {
  const writes = [];
  const route = loadModule("src/app/api/admin/invoices/[id]/status/route.ts", {
    ...common,
    "@/lib/db": {
      prisma: {
        invoice: {
          update: async (args) => {
            writes.push(args);
            return { id: "invoice" };
          },
        },
      },
    },
  });
  for (const [input, stored, timestamp] of [
    ["SENT", "ISSUED", "issuedAt"],
    ["CANCELLED", "VOID", "voidedAt"],
    ["PAID", "PAID", "paidAt"],
  ]) {
    const response = await route.PATCH(request({ status: input }), {
      params: Promise.resolve({ id: "invoice" }),
    });
    assert.equal(response.status, 200);
    assert.equal(writes.at(-1).data.status, stored);
    assert(writes.at(-1).data[timestamp].toISOString());
    assert.equal(writes.at(-1).data.sentAt, undefined);
  }
  assert.equal(
    (
      await route.PATCH(request({ status: "INVALID" }), {
        params: Promise.resolve({ id: "invoice" }),
      })
    ).status,
    400,
  );
  assert.equal(writes.length, 3);
});

test("email API validates recipients, escapes text, and reports delivery truthfully", async () => {
  const sent = [];
  let provider = "SMTP";
  let failure = false;
  const route = loadModule("src/app/api/admin/send-email/route.ts", {
    ...common,
    zod: { z },
    "@prisma/client": { EmailProvider: { CONSOLE: "CONSOLE" } },
    "@/features/emails/services/email-provider.service": {
      sendEmailWithConfiguredProvider: async (input) => {
        if (failure) throw new Error("Delivery unavailable");
        sent.push(input);
        return { provider, messageId: "test-only" };
      },
    },
  });
  const input = {
    to: "buyer@example.invalid",
    cc: "copy@example.invalid, other@example.invalid",
    subject: "Update",
    body: "<img src=x> & hello\nNext line",
  };
  assert.equal((await route.POST(request(input))).status, 200);
  assert.deepEqual(Array.from(sent[0].cc), ["copy@example.invalid", "other@example.invalid"]);
  assert.equal(sent[0].recipientEmail, input.to);
  assert.equal(sent[0].html, "&lt;img src=x&gt; &amp; hello<br>Next line");
  assert.equal((await route.POST(request({ ...input, cc: "invalid-address" }))).status, 400);
  assert.equal(sent.length, 1);
  provider = "CONSOLE";
  assert.equal((await route.POST(request(input))).status, 503);
  failure = true;
  assert.equal((await route.POST(request(input))).status, 502);
});

test("email providers include CC without contacting real services", async () => {
  for (const provider of ["smtp", "resend", "brevo"]) {
    let delivered;
    const service = loadModule(
      "src/features/emails/services/email-provider.service.ts",
      {
        "server-only": {},
        "@prisma/client": {
          EmailProvider: { SMTP: "SMTP", RESEND: "RESEND", BREVO: "BREVO", CONSOLE: "CONSOLE" },
        },
        "@/config/env.server": {
          env: {
            EMAIL_PROVIDER: provider,
            EMAIL_FROM: "sender@example.invalid",
            SMTP_FROM: "sender@example.invalid",
            SMTP_HOST: "example.invalid",
            SMTP_USERNAME: "test",
            SMTP_PASSWORD: "test-only",
            RESEND_API_KEY: "test-only",
            BREVO_API_KEY: "test-only",
            SUPPORT_EMAIL: "support@example.invalid",
          },
        },
        nodemailer: {
          createTransport: () => ({
            sendMail: async (input) => {
              delivered = input;
              return { messageId: "test" };
            },
          }),
        },
      },
      {
        fetch: async (_url, options) => {
          delivered = JSON.parse(options.body);
          return { ok: true, json: async () => ({ id: "test", messageId: "test" }) };
        },
      },
    );
    await service.sendEmailWithConfiguredProvider({
      recipientEmail: "buyer@example.invalid",
      cc: ["copy@example.invalid"],
      subject: "Test",
      html: "Test",
    });
    assert.equal(
      provider === "brevo" ? delivered.cc[0].email : delivered.cc[0],
      "copy@example.invalid",
    );
  }
});
