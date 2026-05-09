// import { prisma } from "@/lib/prisma";
// import ChatClient from "@/app/chat/ui";

import ChatClient from "@/app/chat/UI";
import { prisma } from "@/app/lib/prisma";

export default async function AgentChatPage(
  props: {
    params: { id: string };
  }
) {
  const conversationId = props.params.id;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return <div>Conversation not found</div>;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <ChatClient
      conversationId={conversationId}
      initialMessages={messages}
    />
  );
}