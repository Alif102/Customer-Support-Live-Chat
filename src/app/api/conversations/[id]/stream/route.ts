import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { subscribe } from "@/lib/events"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params

  const conversation = await prisma.conversation.findUnique({
    where: { id },
  })

  if (!conversation) return new Response("Not Found", { status: 404 })

  // Authz: Agent or the owner of the conversation
  if (session.user.role !== "AGENT" && conversation.customerId !== session.user.id) {
    return new Response("Forbidden", { status: 403 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = subscribe(`conversation:${id}`, (message) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
      })

      req.signal.addEventListener("abort", () => {
        unsubscribe()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
