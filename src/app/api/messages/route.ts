import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { publish } from "@/lib/events"
import { NextResponse } from "next/server"
import { z } from "zod"
import { withRequestId } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"

const messageSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().min(1),
})

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestId(requestId);
  
  const session = await auth()
  if (!session?.user) {
    logger.warn("Unauthenticated message attempt");
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // Rate Limiting
  const { allowed, remaining, retryAfterMs } = checkRateLimit(session.user.id);
  if (!allowed) {
    logger.warn({ userId: session.user.id }, "Rate limit exceeded");
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil(retryAfterMs / 1000).toString()
        }
      }
    );
  }

  try {
    const json = await req.json()
    const { conversationId, body } = messageSchema.parse(json)

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      logger.info({ conversationId }, "Conversation not found");
      return new NextResponse("Conversation not found", { status: 404 })
    }

    // Lifecycle check: Reject if CLOSED
    if (conversation.status === "CLOSED") {
      logger.info({ conversationId }, "Attempted to message a closed conversation");
      return new NextResponse("Conversation is closed", { status: 409 });
    }

    // Authorization:
    // Agent can post anywhere.
    // Customer can only post to their own conversation.
    if (session.user.role !== "AGENT" && conversation.customerId !== session.user.id) {
      logger.warn({ userId: session.user.id, conversationId }, "Unauthorized access attempt to conversation");
      return new NextResponse("Forbidden", { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        body,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: { name: true, image: true, role: true }
        }
      }
    })

    // Update conversation updatedAt for sorting
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Include requestId in event payload for tracing
    publish(`conversation:${conversationId}`, { ...message, requestId })

    logger.info({ conversationId, messageId: message.id }, "Message sent successfully");

    return NextResponse.json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 400 })
    }
    logger.error({ error }, "POST /api/messages error");
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
