import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import ChatWindow from "@/components/ChatWindow"
import Link from "next/link"

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "AGENT") redirect("/chat")

  const { id } = await params

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      customer: {
        select: { name: true, email: true }
      },
      messages: {
        take: 100,
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { name: true, role: true }
          }
        }
      }
    }
  })

  if (!conversation) notFound()

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/agent" className="text-blue-600 hover:underline mb-2 inline-block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">
          Chat with {conversation.customer.name || conversation.customer.email}
        </h1>
      </div>

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
