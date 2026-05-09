"use client";

import { useEffect, useRef, useState } from "react";

export function useConversationStream(conversationId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const eventRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    if (eventRef.current) {
      eventRef.current.close();
    }

    const es = new EventSource(
      `/api/conversations/${conversationId}/stream`
    );

    eventRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setMessages((prev) => {
        const exists = prev.find((m) => m.id === data.id);
        if (exists) return prev;

        return [...prev, data];
      });
    };

    return () => {
      es.close();
    };
  }, [conversationId]);

  return { messages, setMessages };
}