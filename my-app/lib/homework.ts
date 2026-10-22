import { apiRequest, unwrap, unwrapPage } from "./api";

export type HomeworkPayload = {
  academic_year_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  attachments?: string[];
};

export type Homework = HomeworkPayload & { id?: string; _id?: string; created_at?: string };

export type HomeworkSubmission = {
  id?: string;
  _id?: string;
  student_id: string;
  content: string;
  attachment_urls?: string[];
  submitted_at?: string;
  marks_obtained?: number | null;
  feedback?: string | null;
  status?: string;
};

export async function listHomework(filters: { class_id?: string; section_id?: string; subject_id?: string }) {
  return unwrapPage<Homework>(await apiRequest("/homework", { query: filters })).items;
}

export async function getHomework(id: string) {
  return unwrap<Homework>(await apiRequest(`/homework/${encodeURIComponent(id)}`));
}

export function createHomework(payload: HomeworkPayload) {
  return apiRequest("/homework", { method: "POST", body: payload });
}

export function deleteHomework(id: string) {
  return apiRequest(`/homework/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listHomeworkSubmissions(id: string) {
  return unwrapPage<HomeworkSubmission>(await apiRequest(`/homework/${encodeURIComponent(id)}/submissions`)).items;
}

export function gradeHomeworkSubmission(id: string, payload: { marks_obtained: number; feedback?: string | null }) {
  return apiRequest(`/homework/submissions/${encodeURIComponent(id)}/grade`, { method: "PUT", body: payload });
}
