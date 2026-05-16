import { ReactNode } from "react"
import Sidebar from "@/components/side-bar"
type Props = {
  children: ReactNode;
};
export default function DashboardLayout({ children } : Props) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}