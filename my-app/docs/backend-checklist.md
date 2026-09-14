# Backend verification checklist

Features were built from the OpenAPI spec while the backend was offline. The spec
documents requests but **not response bodies**, so the frontend makes a few
assumptions. Run through this once the server is up.

Start the app with `npm run dev` and keep the terminal visible — in development the
proxy logs every backend call (`[proxy] GET /academic/years → 200`) and the login
route logs the *shape* of the login response (keys only, no values).

If something fails, the fix is usually in one of these files:

| Assumption | Where it lives |
| --- | --- |
| Lists/records are wrapped as `{ data: ... }` (raw body also accepted) | `lib/api.ts` → `unwrap` |
| Records use `_id` (or `id`) | `lib/api.ts` → `getId`, `findCreatedId` |
| Token field names / cookie names | `lib/server/backend.ts`, `lib/auth-constants.ts` |
| Roles response format | `lib/roles.ts` → `normalizeRoles` |

## 1. Login & session

- [ ] Wrong password shows the backend's error message
- [ ] Correct login lands on `/dashboard/schools`
- [ ] Terminal shows `[auth] login response: { keys: [...], ... }` — note where the token is.
      If login says *"didn't return an access token in a recognised format"*, add the
      real field/cookie name in `lib/server/backend.ts` (`TOKEN_KEYS`) or `lib/auth-constants.ts`
- [ ] Browser devtools → Application → Cookies shows `access-token` on localhost
- [ ] Sidebar → Account shows your email
- [ ] Opening `/dashboard/classes` while logged out redirects to login, and after login returns to `/dashboard/classes`
- [ ] Logout returns to login and the dashboard is no longer reachable
- [ ] Token expiry: when the access token expires, pages keep working (terminal shows
      `(after token refresh)`). If instead you're sent to login, check what `/auth/refresh` expects

## 2. Schools

- [ ] Schools list loads (`GET /tenant/`)
- [ ] Add school → appears in the list
- [ ] Edit school → form is pre-filled, changes save

## 3. Users & roles

- [ ] Create user → success message shows a **User ID** (if not, check the `POST /user` response in the Network tab and update `findCreatedId`)
- [ ] Personal info: leaving all fields empty works; filling some requires all
- [ ] Assign roles → school dropdown lists schools (if you see a text box instead, `GET /tenant/` was refused for this account)
- [ ] Assign `SCHOOL_ADMIN` for a school → appears under Current roles with the school name
- [ ] Assign `SUPER_ADMIN` → no school needed
- [ ] Revoke a role → disappears
- [ ] If assigned roles don't show up, compare the `GET /roles/{user_id}` response with `normalizeRoles`

## 4. Academic years

- [ ] Create a year (e.g. 2026-27, 1 Apr – 31 Mar) → dates display correctly (no off-by-one day)
- [ ] Edit a year → dates pre-filled correctly
- [ ] "Set as current" → badge moves; check whether the previous current year is un-set by the backend

## 5. Classes & sections

- [ ] Year dropdown defaults to the current year
- [ ] Add class → appears in the list, ordered by display order
- [ ] Section tags appear on the list page (relies on `GET /academic/sections` with no `class_id` returning all sections)
- [ ] Class detail: add, rename and delete a section
- [ ] Delete a class that has sections → note what the backend does (error message is shown either way)

## 6. Subjects

- [ ] Add subject linked to two classes → both class names show as tags
- [ ] Filter "Taught in Class X" shows only subjects linked to that class
- [ ] Edit subject → linked classes are pre-ticked; unticking saves
- [ ] Code is saved in uppercase
