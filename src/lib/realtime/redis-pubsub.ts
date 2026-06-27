import "server-only";

import { EventEmitter } from "node:events";
import net from "node:net";
import tls from "node:tls";

import { env } from "@/config/env.server";

type RedisConnectionConfig = {
  database: number | null;
  host: string;
  password: string | null;
  port: number;
  tls: boolean;
  username: string | null;
};

type RedisSocket = net.Socket | tls.TLSSocket;

const REDIS_TIMEOUT_MS = 2500;

function getRedisConfig(): RedisConnectionConfig | null {
  if (!env.REDIS_URL) {
    return null;
  }

  const url = new URL(env.REDIS_URL);

  return {
    database: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : null,
    host: url.hostname,
    password: url.password ? decodeURIComponent(url.password) : null,
    port: Number(url.port || 6379),
    tls: url.protocol === "rediss:",
    username: url.username ? decodeURIComponent(url.username) : null,
  };
}

function encodeCommand(parts: string[]) {
  return parts.reduce(
    (command, part) => `${command}$${Buffer.byteLength(part)}\r\n${part}\r\n`,
    `*${parts.length}\r\n`,
  );
}

function getAuthCommands(config: RedisConnectionConfig) {
  const commands: string[][] = [];

  if (config.password && config.username) {
    commands.push(["AUTH", config.username, config.password]);
  } else if (config.password) {
    commands.push(["AUTH", config.password]);
  }

  if (config.database !== null && Number.isFinite(config.database)) {
    commands.push(["SELECT", String(config.database)]);
  }

  return commands;
}

function connectRedis(config: RedisConnectionConfig) {
  return new Promise<RedisSocket>((resolve, reject) => {
    const socket = config.tls
      ? tls.connect({ host: config.host, port: config.port })
      : net.connect({ host: config.host, port: config.port });
    const timeout = setTimeout(() => {
      socket.destroy(new Error("Redis connection timed out."));
    }, REDIS_TIMEOUT_MS);

    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function parseRespValue(
  buffer: string,
  startIndex = 0,
): { nextIndex: number; value: unknown } | null {
  const prefix = buffer[startIndex];

  if (!prefix) {
    return null;
  }

  if (prefix === "+" || prefix === ":" || prefix === "-") {
    const lineEnd = buffer.indexOf("\r\n", startIndex);

    if (lineEnd === -1) {
      return null;
    }

    return {
      nextIndex: lineEnd + 2,
      value: buffer.slice(startIndex + 1, lineEnd),
    };
  }

  if (prefix === "$") {
    const lineEnd = buffer.indexOf("\r\n", startIndex);

    if (lineEnd === -1) {
      return null;
    }

    const length = Number(buffer.slice(startIndex + 1, lineEnd));
    const valueStart = lineEnd + 2;
    const valueEnd = valueStart + length;

    if (buffer.length < valueEnd + 2) {
      return null;
    }

    if (length < 0) {
      return {
        nextIndex: valueStart,
        value: null,
      };
    }

    return {
      nextIndex: valueEnd + 2,
      value: buffer.slice(valueStart, valueEnd),
    };
  }

  if (prefix === "*") {
    const lineEnd = buffer.indexOf("\r\n", startIndex);

    if (lineEnd === -1) {
      return null;
    }

    const itemCount = Number(buffer.slice(startIndex + 1, lineEnd));
    const values: unknown[] = [];
    let nextIndex = lineEnd + 2;

    for (let index = 0; index < itemCount; index += 1) {
      const parsed = parseRespValue(buffer, nextIndex);

      if (!parsed) {
        return null;
      }

      values.push(parsed.value);
      nextIndex = parsed.nextIndex;
    }

    return {
      nextIndex,
      value: values,
    };
  }

  return null;
}

function decodePayload(payload: string) {
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
}

function encodePayload(payload: unknown) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export async function publishRedisMessage(channel: string, payload: unknown) {
  const config = getRedisConfig();

  if (!config) {
    return;
  }

  const socket = await connectRedis(config);
  const commands = [
    ...getAuthCommands(config),
    ["PUBLISH", channel, encodePayload(payload)],
    ["QUIT"],
  ];

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.destroy(new Error("Redis publish timed out."));
      reject(new Error("Redis publish timed out."));
    }, REDIS_TIMEOUT_MS);

    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    socket.once("close", () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.write(commands.map(encodeCommand).join(""));
  });
}

export async function subscribeRedisMessage<T>(
  channel: string,
  onMessage: (payload: T) => void,
): Promise<() => void> {
  const config = getRedisConfig();

  if (!config) {
    return () => undefined;
  }

  const socket = await connectRedis(config);
  let buffer = "";

  socket.setEncoding("utf8");
  socket.on("data", (chunk) => {
    buffer += chunk;

    while (buffer.length) {
      const parsed = parseRespValue(buffer);

      if (!parsed) {
        break;
      }

      buffer = buffer.slice(parsed.nextIndex);

      if (!Array.isArray(parsed.value)) {
        continue;
      }

      const [messageType, messageChannel, payload] = parsed.value;

      if (messageType === "message" && messageChannel === channel && typeof payload === "string") {
        onMessage(decodePayload(payload) as T);
      }
    }
  });

  socket.write([...getAuthCommands(config), ["SUBSCRIBE", channel]].map(encodeCommand).join(""));

  return () => {
    socket.destroy();
  };
}

type LocalBroker = EventEmitter;

const globalBroker = globalThis as typeof globalThis & {
  __apexRealtimeBroker?: LocalBroker;
};

function getLocalBroker() {
  globalBroker.__apexRealtimeBroker ??= new EventEmitter();
  globalBroker.__apexRealtimeBroker.setMaxListeners(0);

  return globalBroker.__apexRealtimeBroker;
}

export async function publishRealtimeMessage(channel: string, payload: unknown) {
  getLocalBroker().emit(channel, payload);

  try {
    await publishRedisMessage(channel, payload);
  } catch {
    // Local delivery keeps single-instance development working if Redis is unavailable.
  }
}

export async function subscribeRealtimeMessage<T>(
  channel: string,
  onMessage: (payload: T) => void,
) {
  const broker = getLocalBroker();
  broker.on(channel, onMessage);

  let unsubscribeRedis: (() => void) | undefined;

  try {
    unsubscribeRedis = await subscribeRedisMessage(channel, onMessage);
  } catch {
    unsubscribeRedis = undefined;
  }

  return () => {
    broker.off(channel, onMessage);
    unsubscribeRedis?.();
  };
}
