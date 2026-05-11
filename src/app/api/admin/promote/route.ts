import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { withRequestId } from '@/lib/logger';
import { UserRole } from '@prisma/client';

/**
 * Admin Promotion Endpoint
 * 
 * Why: To allow agents to manage the team by promoting customers to agents.
 * Security: Strictly restricted to existing AGENTS.
 */

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestId(requestId);
  
  const session = await auth();

  // 1. Authenticated check
  if (!session?.user) {
    logger.warn('Unauthenticated promotion attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Authorization check (Must be AGENT)
  if (session.user.role !== UserRole.AGENT) {
    logger.warn({ actorId: session.user.id }, 'Non-agent promotion attempt blocked');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 3. Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      logger.info({ targetUserId: userId }, 'Target user not found for promotion');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Idempotency: Already an AGENT?
    if (targetUser.role === UserRole.AGENT) {
      logger.info({ targetUserId: userId }, 'User already an agent');
      return NextResponse.json(targetUser);
    }

    // 5. Perform promotion
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.AGENT },
    });

    logger.info(
      { actorId: session.user.id, targetUserId: userId },
      'User successfully promoted to AGENT'
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error({ error }, 'Failed to promote user');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
