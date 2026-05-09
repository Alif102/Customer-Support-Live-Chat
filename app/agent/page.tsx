"use client"


import { useEffect, useState } from "react";
import axios from "axios";
import { useConversationStream } from "../hooks/useConversationStream";
import ChatBox from "../components/chat/ChatBox";


export default function AgentPage() {
  const [conversations, setConversations] = useState<any[]>([]);

  const [activeId, setActiveId] =
    useState<string>("");

  // 🔥 old messages
  const [history, setHistory] = useState<any[]>([]);

  // 🔥 realtime messages
  const { messages, setMessages } =
    useConversationStream(activeId);

  // load conversation list
  useEffect(() => {
    axios
      .get("/api/debug/conversations")
      .then((res) => {
        setConversations(res.data);
      });
  }, []);

  // 🔥 LOAD OLD HISTORY
  async function loadConversation(id: string) {
    setActiveId(id);

    const res = await axios.get(
      `/api/messages?conversationId=${id}`
    );

    setHistory(res.data);

    // clear old realtime state
    setMessages([]);
  }

  // 🔥 merge old + realtime
  const allMessages = [...history, ...messages];

  return (
    <div className="flex h-screen">

      {/* LEFT */}
      <div className="w-1/3 border-r overflow-y-auto">

        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => loadConversation(c.id)}
            className={`p-3 border-b cursor-pointer ${
              activeId === c.id
                ? "bg-gray-200"
                : ""
            }`}
          >
            <p className="font-bold text-sm">
              {c.customerId}
            </p>

            <p className="text-xs text-gray-500 truncate">
              {
                c.messages?.[
                  c.messages.length - 1
                ]?.body
              }
            </p>
          </div>
        ))}

      </div>

      {/* RIGHT */}
      <div className="w-2/3 flex flex-col">

        {activeId ? (
          <ChatBox
            conversationId={activeId}
            messages={allMessages}
            setMessages={setMessages}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            Select a conversation
          </div>
        )}

      </div>
    </div>
  );
}