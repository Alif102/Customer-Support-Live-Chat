import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Login</h1>
      <form
        action={async () => {
          "use server"
          await signIn("google")
        }}
      >
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  )
}
