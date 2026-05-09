import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    where: { status: "OPEN" },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return Response.json(conversations);
}