// Who can see what. Shared by proxy.ts (route guard), the dashboard layout (sidebar)
// and pages. Must stay dependency-free: proxy.ts runs before the app renders.
//
// The backend enforces permissions on every request; these rules only decide what
// the UI shows, so users never see features they can't use.

export type Session = {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  /** "PLATFORM" for super admins, "TENANT" for school users. */
  scope: string;
  schoolId: string | null;
};

/** Reads the session from the JWT payload. The signature is checked by the backend, not here. */
export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="));
    const p = JSON.parse(json);
    if (typeof p.exp === "number" && p.exp * 1000 < Date.now()) return null;
    return {
      id: String(p.id ?? p.sub ?? ""),
      email: String(p.email ?? ""),
      roles: Array.isArray(p.roles) ? p.roles : [],
      permissions: Array.isArray(p.permissions) ? p.permissions : [],
      scope: String(p.scope ?? ""),
      schoolId: typeof p.school_id === "string" ? p.school_id : null,
    };
  } catch {
    return null;
  }
}

/** Super admins work across all schools and have no school of their own. */
export function isPlatformUser(s: Session) {
  return s.roles.includes("SUPER_ADMIN") || s.scope === "PLATFORM";
}

/** A principal who also teaches keeps the principal workspace. */
export function isTeacherUser(s: Session) {
  return !isPlatformUser(s) && s.roles.includes("TEACHER") && !s.roles.includes("SCHOOL_ADMIN");
}

/** Supports exact permissions plus "*" and "module:*" wildcards. */
export function hasPermission(s: Session, permission: string) {
  const [module] = permission.split(":");
  return s.permissions.some((p) => p === permission || p === "*" || p === `${module}:*`);
}

export type Rule = {
  /** "platform" = super admin only; "school" = school users only. */
  audience: "platform" | "school" | "any";
  /** Allowed if the user has ANY of these roles or permissions. Omit both to allow the whole audience. */
  roles?: string[];
  permissions?: string[];
};

export function canAccess(s: Session, rule: Rule) {
  const platform = isPlatformUser(s);
  if (rule.audience === "platform" && !platform) return false;
  if (rule.audience === "school" && platform) return false;
  if (!rule.roles && !rule.permissions) return true;
  return (
    (rule.roles?.some((r) => s.roles.includes(r)) ?? false) ||
    (rule.permissions?.some((p) => hasPermission(s, p)) ?? false)
  );
}

// ── Areas of the app ──
// Permission names follow the backend's "module:action" format (e.g. "attendance:mark").

export type Area = {
  href: string;
  label: string;
  /** Icon name, resolved in the sidebar (keeps this file free of UI imports). */
  icon: string;
  group: "Platform" | "Setup" | "Academics" | "Finance" | "People";
  rule: Rule;
};

export const AREAS: Area[] = [
  // Super admins manage schools; school users manage their own user accounts.
  { href: "/dashboard/schools", label: "Schools", icon: "school", group: "Platform", rule: { audience: "platform" } },
  {
    href: "/dashboard/users",
    label: "Users & roles",
    icon: "users-cog",
    group: "People",
    rule: { audience: "school", roles: ["SCHOOL_ADMIN"], permissions: ["user:create", "role:assign"] },
  },

  // School — gated by permission
  { href: "/dashboard/academic-years", label: "Academic years", icon: "calendar-range", group: "Setup", rule: { audience: "school", permissions: ["academic:read"] } },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendar-range", group: "Setup", rule: { audience: "school", permissions: ["calendar:read", "calendar:manage"] } },
  { href: "/dashboard/classes", label: "Classes", icon: "layers", group: "Setup", rule: { audience: "school", permissions: ["academic:read"] } },
  { href: "/dashboard/subjects", label: "Subjects", icon: "book", group: "Setup", rule: { audience: "school", permissions: ["academic:read"] } },
  { href: "/dashboard/syllabus", label: "Syllabus", icon: "book", group: "Academics", rule: { audience: "school", permissions: ["syllabus:read", "syllabus:manage"] } },
  { href: "/dashboard/homework", label: "Homework", icon: "clipboard", group: "Academics", rule: { audience: "school", permissions: ["homework:read", "homework:manage"] } },
  { href: "/dashboard/materials", label: "Study materials", icon: "book", group: "Academics", rule: { audience: "school", permissions: ["material:read", "material:manage"] } },
  { href: "/dashboard/notices", label: "Notices", icon: "clipboard", group: "People", rule: { audience: "school", permissions: ["notification:read", "notification:send"] } },
  { href: "/dashboard/ptm", label: "Parent meetings", icon: "calendar-range", group: "People", rule: { audience: "school", roles: ["SCHOOL_ADMIN"], permissions: ["ptm:manage"] } },
  { href: "/dashboard/resources", label: "Resources", icon: "layers", group: "Setup", rule: { audience: "school", permissions: ["resource:read", "resource:manage"] } },
  { href: "/dashboard/attendance", label: "Attendance", icon: "calendar-check", group: "Academics", rule: { audience: "school", permissions: ["attendance:read", "attendance:mark"] } },
  { href: "/dashboard/timetable", label: "Timetable", icon: "clock", group: "Academics", rule: { audience: "school", permissions: ["timetable:read"] } },
  { href: "/dashboard/exams", label: "Exams", icon: "clipboard", group: "Academics", rule: { audience: "school", permissions: ["exam:read"] } },
  { href: "/dashboard/fees", label: "Fees", icon: "rupee", group: "Finance", rule: { audience: "school", permissions: ["fee:read"] } },
  { href: "/dashboard/fees/payment-submissions", label: "Payment reviews", icon: "rupee", group: "Finance", rule: { audience: "school", permissions: ["payment:review"] } },
  { href: "/dashboard/students", label: "Students", icon: "graduation", group: "People", rule: { audience: "school", permissions: ["student:read"] } },
  { href: "/dashboard/parents", label: "Parents", icon: "users", group: "People", rule: { audience: "school", permissions: ["parent:read", "student:read"] } },
  { href: "/dashboard/staff", label: "Staff", icon: "briefcase", group: "People", rule: { audience: "school", permissions: ["staff:read", "user:read"] } },
  { href: "/dashboard/leaves", label: "Leave requests", icon: "calendar-check", group: "People", rule: { audience: "school", permissions: ["leave:manage"] } },

  // Teacher workspace. Class data is loaded using the signed-in user ID.
  { href: "/dashboard/teacher", label: "My teaching", icon: "graduation", group: "Academics", rule: { audience: "school", roles: ["TEACHER"] } },
  { href: "/dashboard/teacher/classes", label: "My classes", icon: "layers", group: "Academics", rule: { audience: "school", roles: ["TEACHER"] } },
  { href: "/dashboard/teacher/schedule", label: "My schedule", icon: "clock", group: "Academics", rule: { audience: "school", roles: ["TEACHER"] } },
  { href: "/dashboard/teacher/exams", label: "Enter marks", icon: "clipboard", group: "Academics", rule: { audience: "school", permissions: ["exam:marks_entry"] } },
  { href: "/dashboard/teacher/notices", label: "My notices", icon: "clipboard", group: "People", rule: { audience: "school", permissions: ["notification:read"] } },
  { href: "/dashboard/teacher/leave", label: "My leave", icon: "calendar-check", group: "People", rule: { audience: "school", permissions: ["leave:apply", "leave:read"] } },
];

/** Pages every signed-in user may open. */
const OPEN_PATHS = ["/dashboard", "/dashboard/forbidden", "/dashboard/change-password"];

/** The area a path belongs to (longest matching prefix), or null for open/unknown paths. */
function areaFor(pathname: string) {
  return (
    AREAS.filter((a) => pathname === a.href || pathname.startsWith(`${a.href}/`)).sort(
      (a, b) => b.href.length - a.href.length
    )[0] ?? null
  );
}

export function canOpenPath(s: Session, pathname: string) {
  if (OPEN_PATHS.includes(pathname)) return true;
  if (isTeacherUser(s)) {
    const allowed = ["/dashboard/teacher", "/dashboard/attendance", "/dashboard/homework", "/dashboard/materials"];
    if (/^\/dashboard\/exams\/schedules\/[^/]+\/marks$/.test(pathname)) {
      return hasPermission(s, "exam:marks_entry");
    }
    if (!allowed.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return false;
  }
  const area = areaFor(pathname);
  // Unknown dashboard paths fall through to Next's 404 rather than a misleading "no access"
  return area ? canAccess(s, area.rule) : true;
}

export function visibleAreas(s: Session) {
  if (isTeacherUser(s)) {
    const teacherPaths = new Set([
      "/dashboard/teacher", "/dashboard/teacher/classes", "/dashboard/teacher/schedule",
      "/dashboard/teacher/exams", "/dashboard/teacher/notices", "/dashboard/teacher/leave",
      "/dashboard/attendance", "/dashboard/homework", "/dashboard/materials",
    ]);
    const order = [...teacherPaths];
    return AREAS.filter((a) => teacherPaths.has(a.href) && canAccess(s, a.rule))
      .sort((a, b) => order.indexOf(a.href) - order.indexOf(b.href));
  }
  return AREAS.filter((a) => !a.href.startsWith("/dashboard/teacher") && canAccess(s, a.rule));
}

/** "SCHOOL_ADMIN" → "School admin", for the sidebar badge. */
export function roleLabel(s: Session) {
  const role = s.roles[0] ?? (isPlatformUser(s) ? "SUPER_ADMIN" : "USER");
  const text = role.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
