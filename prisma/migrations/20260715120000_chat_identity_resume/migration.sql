ALTER TABLE "ChatConversation"
ADD COLUMN "resumeTokenHash" CHAR(64),
ADD COLUMN "resumeTokenExpiresAt" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "ChatConversation_resumeTokenHash_key"
ON "ChatConversation"("resumeTokenHash");

WITH ranked_active_conversations AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY LOWER("visitorEmail")
      ORDER BY "lastMessageAt" DESC, "createdAt" DESC
    ) AS "position"
  FROM "ChatConversation"
  WHERE
    "visitorEmail" IS NOT NULL
    AND "status" IN ('OPEN', 'PENDING_CUSTOMER', 'PENDING_STAFF')
)
UPDATE "ChatConversation" AS conversation
SET
  "status" = 'CLOSED',
  "closedAt" = COALESCE(conversation."closedAt", NOW())
FROM ranked_active_conversations AS ranked
WHERE conversation."id" = ranked."id" AND ranked."position" > 1;

CREATE UNIQUE INDEX "uq_chat_conversations_active_visitor_email"
ON "ChatConversation" (LOWER("visitorEmail"))
WHERE
  "visitorEmail" IS NOT NULL
  AND "status" IN ('OPEN', 'PENDING_CUSTOMER', 'PENDING_STAFF');
