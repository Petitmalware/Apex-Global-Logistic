import type { Metadata } from "next";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { AdminChatConsole } from "@/features/chat/components/admin-chat-console";
import {
  getAdminChatConversation,
  getAdminChatConversations,
  markAdminChatConversationRead,
} from "@/features/chat/queries/chat.queries";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Live Chat | Apex Global Logistics",
};

type AdminChatPageProps = {
  searchParams: Promise<{
    conversation?: string;
  }>;
};

export default async function AdminChatPage({ searchParams }: AdminChatPageProps) {
  const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
  const { conversation: conversationId } = await searchParams;
  let conversations = await getAdminChatConversations(user);
  const selectedConversationId = conversationId ?? conversations[0]?.id;

  if (selectedConversationId) {
    await markAdminChatConversationRead(selectedConversationId, user);
    conversations = await getAdminChatConversations(user);
  }

  const selectedConversation = await getAdminChatConversation(selectedConversationId, user);

  return (
    <ProtectedShell
      activeHref="/admin/chat"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/admin", label: "Admin" },
        { label: "Live Chat" },
      ]}
      description="Reply to customer and visitor chat conversations, review shipment context, and draft professional AI-assisted responses."
      title="Live Chat"
      user={user}
    >
      <AdminChatConsole conversations={conversations} selectedConversation={selectedConversation} />
    </ProtectedShell>
  );
}
