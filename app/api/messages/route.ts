import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { publish } from "@/app/lib/events";
import { getCurrentUser } from "@/app/lib/auth";
import { canAccessConversation } from "@/app/lib/authz";

const MessageSchema = z.object({
  conversationId: z.string(),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = MessageSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { conversationId, body } = parsed.data;

    // 🔐 Authorization check
    const allowed = await canAccessConversation(
      user.id,
      user.role,
      conversationId
    );

    if (!allowed) {
      console.log("❌ AUTH REJECT:", user.id);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 💾 Save message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        body,
      },
      include: {
        sender: true,
      },
    });

    // 🔄 update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 📡 publish event (REAL TIME)
    publish(`conversation:${conversationId}`, {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      conversationId,
      createdAt: message.createdAt,
    });

    console.log("✅ MESSAGE SENT:", message.id);

    return NextResponse.json(message);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}