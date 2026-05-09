"use client";

import { useEffect, useState } from "react";
import { useConversationStream } from "../hooks/useConversationStream";
import ChatBox from "../components/chat/ChatBox";

export default function ChatClient({
  conversationId,
  initialMessages,
}: any) {
  const { messages, setMessages } =
    useConversationStream(conversationId);

  // 🔥 FIX: proper merge ONCE
  const [hydrated, setHydrated] = useState(false);

  const [allMessages, setAllMessages] = useState<any[]>(initialMessages);

  // merge initial once
  useEffect(() => {
    if (!hydrated && initialMessages?.length) {
      setAllMessages(initialMessages);
      setHydrated(true);
    }
  }, [initialMessages, hydrated]);

  // merge SSE messages properly
  useEffect(() => {
    if (messages.length > 0) {
      setAllMessages((prev) => {
        const map = new Map();

        [...prev, ...messages].forEach((m) => {
          map.set(m.id, m);
        });

        return Array.from(map.values());
      });
    }
  }, [messages]);

  return (
    <div className="max-w-xl mx-auto mt-10">
      <ChatBox
        conversationId={conversationId}
        messages={allMessages}
        setMessages={setAllMessages}
      />
    </div>
  );
}