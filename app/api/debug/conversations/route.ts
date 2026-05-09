import { prisma } from "@/app/lib/prisma";


export async function GET() {
  const conversations = await prisma.conversation.findMany({
    where: { status: "OPEN" },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }, // 🔥 FIX 1: ASC order
      },
    },
  });

  return Response.json(conversations);
}