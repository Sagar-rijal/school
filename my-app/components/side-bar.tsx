"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard,
  School,
  CalendarRange,
  Layers,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Users,
  UserCog,
  CalendarCheck,
  IndianRupee,
  ClipboardList,
  Clock,
  UserCircle,
  KeyRound,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react"
import { logoutUser } from "@/lib/auth"
import { roleLabel, visibleAreas, type Session } from "@/lib/access"
import { useAuthStore } from "@/store/useAuthStore"

type NavLink = { href: string; label: string; icon: LucideIcon; exact?: boolean }

// Icon names used in lib/access.ts → components
const ICONS: Record<string, LucideIcon> = {
  school: School,
  "users-cog": UserCog,
  "calendar-range": CalendarRange,
  layers: Layers,
  book: BookOpen,
  "calendar-check": CalendarCheck,
  clock: Clock,
  clipboard: ClipboardList,
  rupee: IndianRupee,
  graduation: GraduationCap,
  users: Users,
  briefcase: BriefcaseBusiness,
}

const GROUP_ORDER = ["Platform", "Setup", "Academics", "Finance", "People"] as const

/** Sidebar groups for this user: only areas their role can use, empty groups dropped. */
function navGroups(session: Session | null): { title: string; links: NavLink[] }[] {
  // exact: /dashboard is the overview, every other page lives under it
  const overview: NavLink = { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true }
  if (!session) return [{ title: "Home", links: [overview] }]

  const areas = visibleAreas(session)
  const groups = GROUP_ORDER.map((title) => ({
    title,
    links: areas
      .filter((a) => a.group === title)
      .map((a) => ({ href: a.href, label: a.label, icon: ICONS[a.icon] ?? LayoutDashboard })),
  })).filter((g) => g.links.length > 0)

  return [{ title: "Home", links: [overview] }, ...groups]
}

function SidebarContent({
  session,
  onNavigate,
}: {
  session: Session | null
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clearAuthUser = useAuthStore((s) => s.clearAuthUser)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logoutUser()
    clearAuthUser()
    router.replace("/auth/login")
  }

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
      {/* Workspace brand */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-5 block rounded-2xl border border-sidebar-border bg-gradient-to-br from-sidebar-accent/80 to-sidebar p-3 shadow-sm transition-colors hover:border-sidebar-ring/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-5" strokeWidth={2.1} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</span>
            <span className="block whitespace-nowrap text-[13px] font-bold tracking-tight text-sidebar-foreground">School Management</span>
          </span>
        </span>
        <span className="mt-3 block border-t border-sidebar-border pt-2.5 text-xs font-medium text-muted-foreground">
          {session ? roleLabel(session) : "Admin Panel"}
        </span>
      </Link>

      {/* Nav Links */}
      <nav className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
        {navGroups(session).map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{group.title}</p>
            {group.links.map((link) => {
              const Icon = link.icon
              const isActive = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={`
                    flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        ))}
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
          <div className="absolute bottom-full mb-2 left-0 w-full bg-popover border rounded-lg shadow-lg z-50">
            <div className="absolute -bottom-1.5 left-6 size-3 bg-popover rotate-45 border-r border-b" />
            <div className="p-4 space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground">Signed in as</p>
                <p className="font-medium break-all">{session?.email || user?.email || "Unknown user"}</p>
              </div>
              <div className="border-t pt-3">
                <Link
                  href="/dashboard/change-password"
                  onClick={() => { setOpen(false); onNavigate?.() }}
                  className="flex items-center gap-2 text-sm hover:bg-accent w-full px-2 py-2 rounded-md"
                >
                  <KeyRound className="w-4 h-4" />
                  Change password
                </Link>
                <button
                  onClick={handleLogout}
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

export default function Sidebar({ session }: { session: Session | null }) {
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
      <aside className="hidden md:flex print:hidden w-64 h-screen border-r bg-sidebar p-4 flex-col shrink-0">
        <SidebarContent session={session} />
      </aside>

      {/* ── MOBILE TOPBAR ── */}
      <div className="md:hidden print:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-sidebar border-b">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-md hover:bg-accent text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Logo inline in topbar */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-4" strokeWidth={2.1} aria-hidden="true" />
          </div>
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">School Management</span>
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
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-sidebar p-4 flex flex-col shadow-xl animate-slide-in">
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-3 right-3 p-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <SidebarContent session={session} onNavigate={handleNavigate} />
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
