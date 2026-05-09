"use client";

import ChatBox from "../components/chat/ChatBox";
import { useConversationStream } from "../hooks/useConversationStream";



export default function ChatClient({
  conversationId,
  initialMessages,
}: any) {
  const { messages, setMessages } =
    useConversationStream(conversationId);

  const merged =
    messages.length > 0 ? messages : initialMessages;

  return (
    <div className="max-w-xl mx-auto mt-10">
      <ChatBox
        conversationId={conversationId}
        messages={merged}
        setMessages={setMessages}
      />
    </div>
  );
}