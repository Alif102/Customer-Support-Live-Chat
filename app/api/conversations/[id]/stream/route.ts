import { NextResponse } from "next/server";
import { subscribe } from "@/app/lib/events";
import { canAccessConversation } from "@/app/lib/authz";
import { getCurrentUser } from "@/app/lib/auth";



export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const conversationId = params.id;
  const channel = `conversation:${conversationId}`;

  // 🔐 AUTH CHECK
  const allowed = await canAccessConversation(
    user.id,
    user.role,
    conversationId
  );

  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      console.log("🔌 SSE CONNECT:", user.id, channel);

      // ⚠️ FIX 1: immediate heartbeat (prevents silent failure)
      controller.enqueue(
        encoder.encode(`: connected\n\n`)
      );

      const unsubscribe = subscribe(channel, (data) => {
        try {
          const payload =
            `data: ${JSON.stringify(data)}\n\n`;

          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error("SSE SEND ERROR:", err);
        }
      });

      // ⚠️ FIX 2: proper cleanup (important)
      req.signal.addEventListener("abort", () => {
        console.log("❌ SSE DISCONNECT:", user.id, channel);
        unsubscribe();
        controller.close();
      });
    },

    cancel() {
      console.log("SSE CANCEL:", user.id);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // ⚠️ important for Nginx/proxy
    },
  });
}