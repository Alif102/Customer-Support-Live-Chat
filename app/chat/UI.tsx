"use client";

import { useState } from "react";
import ChatBox from "../components/chat/ChatBox";


type Props = {
  conversationId: string;
  initialMessages: any[];
  currentUserId: string;
};

export default function ChatClient({
  conversationId,
  initialMessages,
  currentUserId,
}: Props) {

  // 🔥 realtime state
  const [messages, setMessages] =
    useState(initialMessages);
    console.log(messages)
  return (
    <div className="max-w-3xl mx-auto h-screen p-4">
      <ChatBox
        conversationId={conversationId}
        messages={messages}
        setMessages={setMessages}
        currentUserId={currentUserId}
      />
    </div>
  );
}