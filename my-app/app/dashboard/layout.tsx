import { ReactNode } from "react"
import Sidebar from "@/components/side-bar"
import { SessionProvider } from "@/components/session-provider"
import { getSession } from "@/lib/server/session"

type Props = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  // Read once on the server so the sidebar renders only the user's own areas (no flash)
  const session = await getSession()

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen print:block print:h-auto">
        <Sidebar session={session} />
        {/*
          pt-14 on mobile = clears the fixed topbar (h ~56px).
          md:pt-0 = no offset needed on desktop (sidebar is static).
        */}
        <main className="flex-1 overflow-y-auto p-6 pt-[72px] md:pt-6 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
