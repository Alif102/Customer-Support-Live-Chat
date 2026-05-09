import { prisma } from "./prisma";
import { MOCK_ROLE } from "./mock-role";
import { UserRole } from "@prisma/client";

/*
  TEMP AUTH (DEV ONLY)
  Will be replaced by real auth later
*/

export async function getCurrentUser() {
  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@chat.com",
        name: "Demo User",
        role: MOCK_ROLE,
      },
    });
  }

  return {
    ...user,
    role: MOCK_ROLE as UserRole,
  };
}