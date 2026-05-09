"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";
import { socket } from "@/app/hooks/useSocket";


type Props = {
  conversationId: string;
  messages: any[];
  setMessages: React.Dispatch<
    React.SetStateAction<any[]>
  >;
  currentUserId: string;
};

export default function ChatBox({
  conversationId,
  messages,
  setMessages,
  currentUserId,
}: Props) {
  const [text, setText] = useState("");

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // join room
  useEffect(() => {
    if (!conversationId) return;

    socket.emit(
      "join-conversation",
      conversationId
    );

    socket.on(
      "receive-message",
      (message) => {
        setMessages((prev) => {
          const exists = prev.find(
            (m) => m.id === message.id
          );

          if (exists) return prev;

          return [...prev, message];
        });
      }
    );

    return () => {
      socket.off("receive-message");
    };
  }, [conversationId, setMessages]);

  // send
  async function sendMessage() {
    if (!text.trim()) return;

    try {
      const res = await axios.post(
        "/api/messages",
        {
          conversationId,
          body: text,
        }
      );

      socket.emit(
        "send-message",
        res.data
      );

      setText("");

    } catch (error) {
      console.log(error);
    }
  }

console.log(messages)

  return (
    <div className="flex flex-col h-full bg-white">

      {/* HEADER */}
      <div className="border-b p-4 font-semibold">
        Live Chat
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4 space-y-3">

        {messages.map((m: any) => {
          const isMine =
            m.senderId === currentUserId;

          return (
            <div
              key={m.id}
              className={`flex ${
                isMine
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`
                  max-w-xs md:max-w-md
                  px-4 py-2
                  rounded-2xl
                  shadow
                  break-words
                  ${
                    isMine
                      ? "bg-green-500 text-white rounded-br-sm"
                      : "bg-blue-500 text-white rounded-bl-sm"
                  }
                `}
              >
                <p>{m.body}</p>

                <p className="text-[10px] mt-1 text-right opacity-70">
                  {new Date(
                    m.createdAt
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="border-t bg-white p-3 flex gap-2">

        <input
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Type message..."
          className="
            flex-1
            border
            rounded-full
            px-4
            py-2
            outline-none
          "
        />

        <button
          onClick={sendMessage}
          className="
            bg-green-500
            text-white
            px-5
            rounded-full
          "
        >
          Send
        </button>

      </div>
    </div>
  );
}



