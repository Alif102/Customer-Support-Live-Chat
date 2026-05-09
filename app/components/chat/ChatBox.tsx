"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
// import { Message } from "@/app/hooks/useConversationStream";



export default function ChatBox({
  conversationId,
  messages,
  setMessages,
}: any) {
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
  console.log(messages)

  return (
    <>
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {messages.map((m: any) => (
          <div
            key={m.id}
            className="p-2 rounded bg-gray-100"
          >
            {m.body}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex border-t p-2 gap-2">
        <input
          className="flex-1 border p-2"
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
    </>
  );
}