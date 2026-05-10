import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role: UserRole
  }
  interface AdapterSession {
    user?: AdapterUser
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRole
  }
  interface AdapterSession {
    user?: AdapterUser
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
  }
}
