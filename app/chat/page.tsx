// import { prisma } from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth";
import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import ChatClient from "./UI";

export default async function ChatPage() {
  const user = await getCurrentUser();

  // find or create OPEN conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      customerId: user.id,
      status: "OPEN",
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerId: user.id,
        status: "OPEN",
      },
    });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <ChatClient
      conversationId={conversation.id}
      initialMessages={messages}
    />
  );
}