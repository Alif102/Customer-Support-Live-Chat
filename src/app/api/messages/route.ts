import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { publish } from "@/lib/events"
import { NextResponse } from "next/server"
import { z } from "zod"

const messageSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().min(1),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const json = await req.json()
    const { conversationId, body } = messageSchema.parse(json)

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) return new NextResponse("Conversation not found", { status: 404 })

    // Authorization:
    // Agent can post anywhere.
    // Customer can only post to their own conversation.
    if (session.user.role !== "AGENT" && conversation.customerId !== session.user.id) {
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

    publish(`conversation:${conversationId}`, message)

    return NextResponse.json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 400 })
    }
    console.error("POST /api/messages error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
