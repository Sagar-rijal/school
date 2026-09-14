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
| Class roster format (enrollments or students) | `lib/students.ts` → `getRoster` |
| Invoice amount fields (`total_amount`, `paid_amount`, `balance_due`) | `lib/fees.ts` → `invoiceAmounts` |
| Report card fields (percentage, grade, rank, subjects) | `lib/exams.ts` → `reportCardSummary`, `reportCardSubjects` |
| Exam result pass/fail field | `lib/exams.ts` → `resultPassed` |
| Weekly timetable format (flat / by day / grouped) | `lib/timetable.ts` → `normalizeWeekly` |
| Report endpoints (attendance/fee summaries) | shown generically by `NumberStats` — any numeric fields appear |

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

## 7. Staff & departments

- [ ] Add a department, then a teaching staff member in it with subjects and a qualification
- [ ] Staff list filters (department, type, status) narrow the list
- [ ] Edit staff → employee ID, staff type and joining date are locked; status saves
- [ ] Put a real login **User ID** on a teacher — needed for teacher assignments

## 8. Students, parents & enrollment

- [ ] Add student with "Enroll in a class" filled → lands on the new student's profile, enrolled
      (if it lands on the list instead, the create response has no ID — update `findCreatedId`)
- [ ] Students list with class + section selected shows **roll numbers**
- [ ] Profile: edit an enrollment (roll number, section, status)
- [ ] Profile: add a new parent (auto-linked), link an existing parent, unlink
- [ ] Delete a test student

## 9. Teacher assignments

- [ ] Class page → Teachers card lists teachers that have a User ID
- [ ] Assign as class teacher and for a subject; remove one
- [ ] Staff profile → Class assignments shows the same

## 10. Attendance

- [ ] Pick class/section/date → roster appears; "All present", change one to Absent, add a remark, save
- [ ] Reload the page → saved marks come back (tests `GET /attendance/class/...` with the date)
- [ ] Per-period attendance with a period number saves separately from daily
- [ ] Student profile → Attendance card shows summary numbers and the absent day

## 11. Fees

- [ ] Create categories, then a fee structure for a class → total matches
- [ ] Generate one invoice from a student profile (+ Invoice)
- [ ] Generate for a whole section → created count; running it again skips everyone
- [ ] Invoice page: amounts correct; record a partial payment → paid/balance/status update
- [ ] Try paying more than the balance → blocked (and backend rejects duplicate receipt numbers)
- [ ] Collections for today lists the payment with totals by mode
- [ ] Student profile → Fees card summary shows money values

## 12. Exams

- [ ] Schedule an exam for a class section (subject list shows subjects linked to that class)
- [ ] Marks: enter marks, mark one absent, save → grade/percentage/pass appear after reload
- [ ] Exam for "All sections" lists students from every section
- [ ] Report cards: Generate → ranked list; View → printable card with subject rows; Publish
- [ ] Student profile → Exam results lists the marks and report card links

## 13. Timetable

- [ ] Periods: add Period 1–N and a break
- [ ] Class timetable: set a slot (subject, teacher, room) → appears in the grid
- [ ] Put the same teacher in the same period for another section → backend clash error is shown
- [ ] Copy Monday to other weekdays; clear a slot; clear timetable
- [ ] Teacher schedule shows the teacher's classes (also via Staff profile → Weekly schedule)
