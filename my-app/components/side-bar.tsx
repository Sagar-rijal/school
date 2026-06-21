"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  UserRound,
  School,
  IndianRupee,
  CalendarCheck2,
  FileBarChart2,
  UserCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/teachers", label: "Teachers", icon: UserRound },
  { href: "/dashboard/classes", label: "Classes", icon: School },
  { href: "/dashboard/register-user", label: "Register-user", icon: IndianRupee },
  { href: "/dashboard/update-school", label: "Update-school", icon: CalendarCheck2 },
  { href: "/dashboard/register", label: "Add school", icon: FileBarChart2 },
]

const user = {
  email: "user@example.com",
}

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-sm text-muted-foreground font-medium">Admin Panel</p>
          <p className="text-md font-bold text-foreground">School Management</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-md font-medium transition-colors
                ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Profile */}
      <div ref={containerRef} className="relative mt-4">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-accent hover:bg-accent/80"
        >
          <UserCircle className="w-5 h-5" />
          <span className="text-sm">Account</span>
        </button>

        {open && (
          <div className="absolute bottom-full mb-2 left-0 w-full bg-white border rounded-lg shadow-lg z-50">
            <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-white rotate-45 border-r border-b" />
            <div className="p-4 space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground">Signed in as</p>
                <p className="font-medium break-all">{user.email}</p>
              </div>
              <div className="border-t pt-3">
                <button
                  onClick={() => console.log("logout")}
                  className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 w-full px-2 py-2 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close drawer on route change (navigation)
  const handleNavigate = () => setMobileOpen(false)

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <>
      {/* ── DESKTOP SIDEBAR (unchanged) ── */}
      <aside className="hidden md:flex w-64 h-screen border-r bg-background p-4 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* ── MOBILE TOPBAR ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-background border-b">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-md hover:bg-accent text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Logo inline in topbar */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span className="font-bold text-sm text-foreground">School Management</span>
        </div>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-background p-4 flex flex-col shadow-xl animate-slide-in">
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-3 right-3 p-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <SidebarContent onNavigate={handleNavigate} />
          </aside>
        </div>
      )}

      {/* Slide-in animation */}
      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.22s ease-out;
        }
      `}</style>
    </>
  )
}