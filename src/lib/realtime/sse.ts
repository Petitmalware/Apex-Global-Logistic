import "server-only";

const encoder = new TextEncoder();

export function encodeSseMessage({
  data,
  event,
}: {
  data: unknown;
  event: "heartbeat" | "snapshot";
}) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function createSseResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
