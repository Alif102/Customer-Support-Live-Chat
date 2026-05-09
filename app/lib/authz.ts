import { ConvStatus, UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export async function canAccessConversation(
  userId: string,
  role: UserRole,
  conversationId: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
  });

  if (!conversation) {
    return false;
  }

  if (conversation.status !== ConvStatus.OPEN) {
    return false;
  }

  // AGENT can access all OPEN conversations
  if (role === UserRole.AGENT) {
    return true;
  }

  // CUSTOMER only own conversation
  return conversation.customerId === userId;
}