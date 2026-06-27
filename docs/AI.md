# AI Features

Apex AI is implemented as a provider-agnostic layer under `src/features/ai`.

## Capabilities

- Customer support answers with optional shipment context.
- Shipment summaries from packages, timelines, invoices, and documents.
- Notification copy drafting.
- Admin email drafting through the same service used by Email Studio AI assist.
- Semantic search over scoped shipments and support tickets.
- Shipment risk detection with deterministic risk factors plus AI narrative.

## Provider Abstraction

`generateAiText` is the single provider entry point. It supports:

- `local` deterministic development fallback.
- `openai` using an OpenAI-compatible chat completions endpoint.
- `groq` using an OpenAI-compatible chat completions endpoint.
- `openrouter` using an OpenAI-compatible chat completions endpoint.
- `gemini` using Gemini `generateContent`.

Set `AI_PROVIDER` and the matching API key in the server environment. Provider keys are never exposed to the browser.

## Security

- `/ai` requires `ai:read`.
- Generative AI APIs require `ai:create`, except admin email drafting which requires `emails:create`.
- Shipment-aware tools call the existing shipment query layer, so user, role, and organization access rules remain centralized.
- Rich email output is sanitized before it is returned to the UI.
- Every AI interaction attempts to write an `AiConversation` with user, organization, shipment, task, provider, and model metadata.

## Operational Notes

The local provider keeps development and automated checks stable without network access. In production, a configured remote provider must have its matching API key; otherwise requests fail instead of silently falling back.

Semantic search currently uses provider-assisted query expansion plus deterministic scoring over scoped records. This keeps the first version database-safe and leaves room for vector indexes or external embedding storage later.
