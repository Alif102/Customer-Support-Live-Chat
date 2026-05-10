import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import ChatWindow from "@/components/ChatWindow"

export default async function ChatPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "CUSTOMER") {
    console.warn(`AuthZ: User ${session.user.email} (role: ${session.user.role}) rejected from /chat. Redirecting to /agent.`)
    redirect("/agent")
  }

  const conversationInclude = {
    messages: {
      take: 50,
      orderBy: { createdAt: "asc" as const },
      include: {
        sender: {
          select: { name: true, role: true }
        }
      }
    }
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      customerId: session.user.id,
      status: "OPEN",
    },
    include: conversationInclude
  })

  if (!conversation) {
    try {
      conversation = await prisma.conversation.create({
        data: {
          customerId: session.user.id,
          status: "OPEN",
        },
        include: conversationInclude
      })
    } catch (e) {
      // If concurrent create happened, find it
      conversation = await prisma.conversation.findFirst({
        where: {
          customerId: session.user.id,
          status: "OPEN",
        },
        include: conversationInclude
      })
    }
  }

  if (!conversation) return <div>Failed to initialize chat.</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Support Chat</h1>
      <ChatWindow
        conversationId={conversation.id}
        initialMessages={conversation.messages.map(m => ({
          ...m,
          createdAt: m.createdAt.toISOString()
        }))}
        currentUserId={session.user.id}
      />
    </div>
  )
}
