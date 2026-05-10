import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import {PrismaAdapter} from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const {handlers, auth, signIn, signOut} = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true, // Required for seeded agent linking
            authorization: {
                params: {
                    // prompt: "consent", //দিলে প্রতিবার অ্যাপের পারমিশন চাইবে।
                    prompt: "select_account", //দিলে ইউজারকে প্রতিবার অ্যাকাউন্ট সিলেক্ট করতে বলবে।
                    access_type: "offline",
                    response_type: "code",
                },
            },

        }),
    ],
    session: {
        strategy: "database",
    },
    callbacks: {
        session({session, user}) {
            return {
                ...session,
                user: {
                    id: user.id,
                    role: user.role,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                },
            }
        },
    },
    events: {
        async signIn({user, account}) {
            console.log(`Sign-in: ${user.email} via ${account?.provider}`)
        },
        async signOut(message) {
            if ("session" in message && message.session) {
                console.log(`Sign-out: Session ${message.session.sessionToken}`)
            }
        },
    },
})
