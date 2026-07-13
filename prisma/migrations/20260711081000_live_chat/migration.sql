-- CreateEnum
CREATE TYPE "ChatConversationStatus" AS ENUM ('OPEN', 'PENDING_CUSTOMER', 'PENDING_STAFF', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChatMessageAuthorType" AS ENUM ('VISITOR', 'CUSTOMER', 'STAFF', 'AI', 'SYSTEM');

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "customerId" UUID,
    "assignedToId" UUID,
    "shipmentId" UUID,
    "trackingReference" VARCHAR(120),
    "visitorName" VARCHAR(160),
    "visitorEmail" VARCHAR(255),
    "visitorPhone" VARCHAR(40),
    "subject" VARCHAR(200) NOT NULL DEFAULT 'Live chat',
    "status" "ChatConversationStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "accessKeyHash" CHAR(64),
    "lastMessageAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(6),
    "closedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "authorId" UUID,
    "authorType" "ChatMessageAuthorType" NOT NULL,
    "body" TEXT NOT NULL,
    "isAiDraft" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatConversation_accessKeyHash_key" ON "ChatConversation"("accessKeyHash");

-- CreateIndex
CREATE INDEX "idx_chat_conversations_organization_status_last_message" ON "ChatConversation"("organizationId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "idx_chat_conversations_customer_last_message" ON "ChatConversation"("customerId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "idx_chat_conversations_assignee_status" ON "ChatConversation"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "idx_chat_conversations_shipment_id" ON "ChatConversation"("shipmentId");

-- CreateIndex
CREATE INDEX "idx_chat_conversations_visitor_email_last_message" ON "ChatConversation"("visitorEmail", "lastMessageAt");

-- CreateIndex
CREATE INDEX "idx_chat_messages_conversation_created_at" ON "ChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_chat_messages_author_created_at" ON "ChatMessage"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_chat_messages_author_type_created_at" ON "ChatMessage"("authorType", "createdAt");

-- CreateIndex
CREATE INDEX "idx_chat_messages_read_at" ON "ChatMessage"("readAt");

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
