import { signIn, signOut } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 gap-4">
      <h1 className="text-4xl font-bold mb-8">Login</h1>
      
      <form
        action={async () => {
          "use server"
          await signIn("google", { redirectTo: "/chat" })
        }}
        className="flex flex-col gap-4"
      >
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-48"
        >
          Login as Customer
        </button>
      </form>
      
      <form
        action={async () => {
          "use server"
          await signIn("google", { redirectTo: "/agent" })
        }}
        className="flex flex-col gap-4"
      >
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-48"
        >
          Login as Agent
        </button>
      </form>

      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/login" })
        }}
        className="mt-8"
      >
        {/*<button type="submit" className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors w-48">*/}
        {/*  Sign out*/}
        {/*</button>*/}

      </form>
    </div>
  )
}
