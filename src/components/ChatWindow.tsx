"use client"

import { useEffect, useState, useRef } from "react"

interface Message {
  id: string
  body: string
  senderId: string
  createdAt: string
  sender: {
    name: string | null
    role: string
  }
}

export default function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId,
}: {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const eventSource = new EventSource(`/api/conversations/${conversationId}/stream`)

    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data)
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
    }

    return () => {
      eventSource.close()
    }
  }, [conversationId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return

    const body = input
    setInput("")

    try {
      await fetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId, body }),
        headers: { "Content-Type": "application/json" },
      })
    } catch (err) {
      console.error("Failed to send message:", err)
    }
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white shadow-sm">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((m) => {
          const isMe = m.senderId === currentUserId
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  isMe
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="text-xs opacity-70 mb-1">
                  {m.sender.name || "User"} ({m.sender.role})
                </div>
                <div>{m.body}</div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {new Date(m.createdAt).toLocaleTimeString()}
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
