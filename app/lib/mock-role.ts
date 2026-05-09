import { UserRole } from "@prisma/client";

function getMockRole(): UserRole {
  const role = process.env.MOCK_ROLE;

  if (role === "AGENT") return "AGENT";
  return "CUSTOMER";
}

export const MOCK_ROLE = getMockRole();