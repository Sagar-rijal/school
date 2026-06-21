import { ReactNode } from "react"
import Sidebar from "@/components/side-bar"

type Props = {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      {/*
        pt-14 on mobile = clears the fixed topbar (h ~56px).
        md:pt-0 = no offset needed on desktop (sidebar is static).
      */}
      <main className="flex-1 overflow-y-auto p-6 pt-[72px] md:pt-6">
        {children}
      </main>
    </div>
  )
}