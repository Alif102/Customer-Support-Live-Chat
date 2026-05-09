import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { publish } from "@/app/lib/events";
import { getCurrentUser } from "@/app/lib/auth";
import { canAccessConversation } from "@/app/lib/authz";



const schema = z.object({
  conversationId: z.string(),
  body: z.string().min(1),
});


// =========================
// POST MESSAGE
// =========================

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const json = await req.json();

    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body" },
        { status: 400 }
      );
    }

    const { conversationId, body } = parsed.data;

    const allowed = await canAccessConversation(
      user.id,
      user.role,
      conversationId
    );

    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // save
    const message = await prisma.message.create({
      data: {
        body,
        conversationId,
        senderId: user.id,
      },
    });

    // realtime publish
    publish(`conversation:${conversationId}`, message);

    return NextResponse.json(message);

  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}



// =========================
// GET MESSAGES
// =========================

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const conversationId =
      searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 }
      );
    }

    const allowed = await canAccessConversation(
      user.id,
      user.role,
      conversationId
    );

    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);

  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}