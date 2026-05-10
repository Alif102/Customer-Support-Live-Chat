import { signOut } from "@/auth"

export default function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/login" })
      }}
    >
      <button
        type="submit"
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
      >
        Sign out
      </button>
    </form>
  )
}
