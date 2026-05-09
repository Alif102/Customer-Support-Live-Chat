"use client"


import { useEffect, useState } from "react";
import axios from "axios";
import { useConversationStream } from "../hooks/useConversationStream";
import ChatBox from "../components/chat/ChatBox";


export default function AgentPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // load conversations
  useEffect(() => {
    axios.get("/api/debug/conversations").then((res) => {
      setConversations(res.data);
    });
  }, []);

  const { messages, setMessages } =
    useConversationStream(activeId || "");

  return (
    <div className="flex max-w-5xl mx-auto mt-10 gap-4">
      
      {/* LEFT SIDE - LIST */}
      <div className="w-1/3 space-y-2 border p-2">
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`p-2 border cursor-pointer rounded ${
              activeId === c.id ? "bg-gray-200" : ""
            }`}
          >
            <p className="font-bold text-sm">
              Conversation: {c.id}
            </p>
            <p className="text-xs text-gray-500">
              {c.messages?.[0]?.body || "No messages"}
            </p>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE - CHAT */}
      <div className="w-2/3">
        {activeId ? (
          <ChatBox
            conversationId={activeId}
            messages={messages}
            setMessages={setMessages}
          />
        ) : (
          <div className="text-gray-500">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}