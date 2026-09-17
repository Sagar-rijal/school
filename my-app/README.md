# School Management

Admin panel for a multi-school management backend (FastAPI). Built with Next.js 16
(App Router), React 19, Tailwind CSS 4 and shadcn-style UI components.

## Running locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Create `.env.local` with the backend origin (no path, no trailing slash):

```
BACKEND_URL=https://your-backend-host
```

The same variable must be set in the hosting environment (e.g. Vercel project settings).
Without it, every API call returns "BACKEND_URL is not configured".

Other scripts: `npm run build` (production build, also type-checks), `npm run lint`.

## How the app talks to the backend

The browser never calls the backend directly — requests go through this app's server:

```
Browser ──cookie──▶ Next.js route handlers ──token──▶ FastAPI backend
```

| File | Role |
| --- | --- |
| `app/api/v1/school-backend/[...path]/route.ts` | Forwards every backend call, attaches the session, refreshes an expired token once and retries |
| `app/api/auth/login/route.ts` | Logs in and stores tokens in httpOnly cookies (whether the backend returns them as cookies or in the body) |
| `app/api/auth/logout/route.ts` | Clears the session cookies (the backend has no logout endpoint) |
| `lib/server/backend.ts` | Server-only: token extraction, cookie handling, refresh |
| `proxy.ts` | Redirects logged-out visitors to `/auth/login` (Next 16's replacement for `middleware.ts`) |
| `lib/api.ts` | Client-side `apiRequest`: query strings, error messages, expired-session redirect |

## Project structure

```
app/
  auth/login, auth/forgot-password
  dashboard/
    page.tsx                overview
    schools/, academic-years/, classes/, subjects/
    students/, parents/, staff/, users/
    attendance/, exams/, fees/, timetable/
  api/                      route handlers (above)
components/
  ui/                       shadcn primitives (button, input, label…)
  form.tsx                  Field, Select, FormSection, Alert, PageHeader
  data-display.tsx          Table, StatusBadge, Card, StatTile, NumberStats…
  class-section-picker.tsx  year → class → section selects
  section-tabs.tsx          tab bar for Fees and Exams areas
  <feature>/                forms and panels per feature
hooks/
  use-query.ts              keyed data loading (race-safe, background reload)
  use-url-filters.ts        keeps list filters in the URL
  use-academic-years.ts, use-academic-lookup.ts, use-classes.ts, use-student-names.ts
lib/
  api.ts, auth.ts           request layer
  <feature>.ts              API functions, one file per backend area
  types/<feature>.ts        request/response types mirroring the OpenAPI spec
  utils.ts                  dates, currency, enums, small helpers
docs/backend-checklist.md   what to verify against the live backend
```

## Adding a feature

1. **Types** in `lib/types/<feature>.ts`, copied from the backend's OpenAPI schema.
   Enums become `as const` arrays so the UI can render options from them.
2. **API functions** in `lib/<feature>.ts` using `apiRequest`. Pages never call `fetch`.
3. **Components** in `components/<feature>/` — one form shared by create and edit.
4. **Pages** under `app/dashboard/<feature>/`, then add the sidebar link in
   `components/side-bar.tsx`.

Conventions worth keeping:

- List filters live in the URL (`useUrlFilters`), so a refresh or shared link shows the same view.
- Data loading goes through `useQuery`; don't call setState directly inside effects (the
  React lint rule rejects it, and keyed loading avoids stale responses).
- Fields the backend refuses to update (admission number, employee ID, exam subject…) are
  disabled in edit mode and stripped from the payload.
- Dates: `<input type="date">` values are converted with `fromDateInput`/`toDateInput`,
  which avoids timezone shifts.
- Response shapes that the spec doesn't document are read defensively in one place —
  see the table in `docs/backend-checklist.md`.

## Testing

`npm run build` type-checks and `npm run lint` must both pass.

The features were built against the OpenAPI spec while the backend was offline, and
verified in headless Chrome against a fixture backend (all pages render, and attendance,
marks, timetable, payments and report cards send the expected requests). Before trusting
the app against the real server, work through `docs/backend-checklist.md`.
