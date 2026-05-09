"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Message } from "@/app/hooks/useConversationStream";

export default function ChatBox({
  conversationId,
  messages,
  setMessages,
}: {
  conversationId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim()) return;

    await axios.post("/api/messages", {
      conversationId,
      body: text,
    });

    setText("");
  }

  return (
    <div className="flex flex-col h-[500px] border rounded p-3">
      {/* messages */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="p-2 bg-gray-100 rounded">
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="flex gap-2 mt-2">
        <input
          className="border flex-1 p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="bg-black text-white px-4"
        >
          Send
        </button>
      </div>
    </div>
  );
}