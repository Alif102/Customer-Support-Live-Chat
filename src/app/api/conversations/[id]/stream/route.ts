import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { subscribe } from "@/lib/events"
import { withConnectionId } from "@/lib/logger"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const connectionId = crypto.randomUUID();
  const session = await auth()
  
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const logger = withConnectionId(connectionId, session.user.id);
  const { id } = await params

  const conversation = await prisma.conversation.findUnique({
    where: { id },
  })

  if (!conversation) {
    logger.info({ conversationId: id }, "Stream: Conversation not found");
    return new Response("Not Found", { status: 404 })
  }

  // Authz: Agent or the owner of the conversation
  if (session.user.role !== "AGENT" && conversation.customerId !== session.user.id) {
    logger.warn({ conversationId: id }, "Stream: Forbidden access attempt");
    return new Response("Forbidden", { status: 403 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      logger.info({ conversationId: id }, "SSE Connection established");
      
      const unsubscribe = subscribe(`conversation:${id}`, (message) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
      })

      req.signal.addEventListener("abort", () => {
        unsubscribe()
        logger.info({ conversationId: id }, "SSE Connection aborted");
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
