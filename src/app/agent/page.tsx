import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import LogoutButton from "@/components/LogoutButton"

export default async function AgentDashboard() {
  const session = await auth()
  if (!session) redirect("/login")
  
  // Auto-upgrade role to AGENT if user is not already an agent
  if (session.user.role !== "AGENT") {
    // await prisma.user.update({
    //   where: { id: session.user.id },
    //   data: { role: "AGENT" }
    // })

    // Force refresh the page to reflect the new role in the session
    // redirect("/agent")
    redirect("/chat")
  }

  const conversations = await prisma.conversation.findMany({
    where: { status: "OPEN" },
    orderBy: { updatedAt: "desc" },
    include: {
      customer: {
        select: { name: true, email: true }
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      }
    }
  })

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agent Dashboard - Open Conversations</h1>
        <LogoutButton />
      </div>
      <div className="space-y-4">
        {conversations.length === 0 && (
          <p className="text-gray-500">No open conversations.</p>
        )}
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            href={`/agent/${conv.id}`}
            className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-lg">
                {conv.customer.name || conv.customer.email}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(conv.updatedAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {conv.messages[0]?.body || "No messages yet"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
