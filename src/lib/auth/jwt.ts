import { AUTH_ROLES, type AppRole } from "@/lib/auth/constants";

const JWT_ALGORITHM = "HS256";
const JWT_AUDIENCE = "apex-global-logistics";
const JWT_ISSUER = "apex-global-logistics";

export type AccessTokenPayload = {
  aud: typeof JWT_AUDIENCE;
  email: string;
  exp: number;
  iat: number;
  iss: typeof JWT_ISSUER;
  name: string;
  organizationId: string | null;
  permissions: string[];
  roles: AppRole[];
  sub: string;
  typ: "access";
};

type JwtHeader = {
  alg: typeof JWT_ALGORITHM;
  typ: "JWT";
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_JWT_SECRET must be set to at least 32 characters.");
  }

  return secret;
}

function base64UrlEncode(input: string | ArrayBuffer) {
  const bytes = typeof input === "string" ? textEncoder.encode(input) : new Uint8Array(input);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(input: string) {
  const padded = input
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getJwtSecret()),
    {
      hash: "SHA-256",
      name: "HMAC",
    },
    false,
    ["sign", "verify"],
  );
}

async function signData(data: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(data));

  return base64UrlEncode(signature);
}

function isAppRole(role: string): role is AppRole {
  return Object.values(AUTH_ROLES).includes(role as AppRole);
}

function decodeJsonSegment<T>(segment: string) {
  return JSON.parse(textDecoder.decode(base64UrlDecode(segment))) as T;
}

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, "aud" | "exp" | "iat" | "iss" | "typ">,
  expiresInSeconds: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = {
    alg: JWT_ALGORITHM,
    typ: "JWT",
  };
  const fullPayload: AccessTokenPayload = {
    ...payload,
    aud: JWT_AUDIENCE,
    exp: now + expiresInSeconds,
    iat: now,
    iss: JWT_ISSUER,
    typ: "access",
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signData(signingInput);

  return `${signingInput}.${signature}`;
}

export async function verifyAccessToken(token: string) {
  try {
    const [encodedHeader, encodedPayload, signature, extra] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature || extra) {
      return null;
    }

    const header = decodeJsonSegment<JwtHeader>(encodedHeader);

    if (header.alg !== JWT_ALGORITHM || header.typ !== "JWT") {
      return null;
    }

    const expectedSignature = await signData(`${encodedHeader}.${encodedPayload}`);

    if (!constantTimeEqual(signature, expectedSignature)) {
      return null;
    }

    const payload = decodeJsonSegment<AccessTokenPayload>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);

    if (
      payload.typ !== "access" ||
      payload.iss !== JWT_ISSUER ||
      payload.aud !== JWT_AUDIENCE ||
      payload.exp <= now ||
      !payload.roles.every(isAppRole)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
