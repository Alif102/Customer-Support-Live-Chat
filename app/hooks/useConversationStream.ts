"use client";

import { useEffect, useRef, useState } from "react";

export type Message = {
  id: string;
  body: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
};

export function useConversationStream(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const eventRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    // ❗ prevent duplicate connections
    if (eventRef.current) {
      eventRef.current.close();
    }

    const es = new EventSource(
      `/api/conversations/${conversationId}/stream`
    );

    eventRef.current = es;

    es.onmessage = (event) => {
      const data: Message = JSON.parse(event.data);

      setMessages((prev) => {
        // ❗ prevent duplicate messages
        const exists = prev.find((m) => m.id === data.id);
        if (exists) return prev;

        return [...prev, data];
      });
    };

    es.onerror = () => {
      console.log("SSE ERROR - reconnecting...");
      es.close();
    };

    return () => {
      es.close();
      eventRef.current = null;
    };
  }, [conversationId]);

  return { messages, setMessages };
}