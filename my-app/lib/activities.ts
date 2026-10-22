import { apiRequest, unwrapPage } from "./api";

export const ACTIVITY_CATEGORIES = ["ACADEMIC", "SPORTS", "ARTS", "CONDUCT", "DISCIPLINE", "LEADERSHIP"] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export type StudentActivityPayload = {
  student_id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  rating_or_score?: string | null;
  event_date: string;
};

export type StudentActivity = StudentActivityPayload & { id?: string; _id?: string; created_at?: string };

export async function listStudentActivities(studentId: string, category?: ActivityCategory) {
  return unwrapPage<StudentActivity>(await apiRequest(`/activities/student/${encodeURIComponent(studentId)}`, { query: { category } })).items;
}

export function createStudentActivity(payload: StudentActivityPayload) {
  return apiRequest("/activities", { method: "POST", body: payload });
}
