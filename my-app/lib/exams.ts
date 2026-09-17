import { apiRequest, unwrap } from "./api";
import type {
  BulkMarksPayload,
  ExamFilters,
  ExamResult,
  ExamResultUpdatePayload,
  ExamSchedule,
  ExamSchedulePayload,
  ExamScheduleUpdatePayload,
  ReportCard,
  ReportCardGeneratePayload,
} from "./types/exams";

// ── Schedules ──

export async function listExamSchedules(filters: ExamFilters = {}) {
  return unwrap<ExamSchedule[]>(await apiRequest("/exams/schedules", { query: filters })) ?? [];
}

export async function getExamSchedule(examId: string) {
  return unwrap<ExamSchedule>(await apiRequest(`/exams/schedules/${examId}`));
}

export function createExamSchedule(payload: ExamSchedulePayload) {
  return apiRequest("/exams/schedules", { method: "POST", body: payload });
}

export function updateExamSchedule(examId: string, payload: ExamScheduleUpdatePayload) {
  return apiRequest(`/exams/schedules/${examId}`, { method: "PUT", body: payload });
}

export function deleteExamSchedule(examId: string) {
  return apiRequest(`/exams/schedules/${examId}`, { method: "DELETE" });
}

// ── Marks ──

/** Enter marks for many students. Re-submitting updates existing results. */
export function enterBulkMarks(payload: BulkMarksPayload) {
  return apiRequest("/exams/marks/bulk", { method: "POST", body: payload });
}

/** Single-result correction. The UI re-submits /exams/marks/bulk instead, which updates existing results. */
export function updateExamResult(resultId: string, payload: ExamResultUpdatePayload) {
  return apiRequest(`/exams/marks/${resultId}`, { method: "PUT", body: payload });
}

export async function getExamResults(examId: string) {
  return unwrap<ExamResult[]>(await apiRequest(`/exams/marks/${examId}`)) ?? [];
}

export async function getStudentResults(studentId: string, academicYearId?: string) {
  const res = await apiRequest(`/exams/marks/student/${studentId}`, { query: { academic_year_id: academicYearId } });
  return unwrap<ExamResult[]>(res) ?? [];
}

export function resultPassed(result: ExamResult): boolean | null {
  return result.is_passed ?? result.passed ?? result.is_pass ?? null;
}

// ── Report cards ──

export function generateReportCards(payload: ReportCardGeneratePayload) {
  return apiRequest("/exams/report-cards/generate", { method: "POST", body: payload });
}

/** Publishing makes the cards visible to students and parents. Takes query parameters. */
export function publishReportCards(query: ReportCardGeneratePayload) {
  return apiRequest("/exams/report-cards/publish", { method: "POST", query });
}

export async function getClassReportCards(classId: string, sectionId: string, examType: string, academicYearId: string) {
  const res = await apiRequest(`/exams/report-cards/class/${classId}/${sectionId}`, {
    query: { exam_type: examType, academic_year_id: academicYearId },
  });
  return unwrap<ReportCard[]>(res) ?? [];
}

export async function getStudentReportCards(studentId: string, academicYearId?: string) {
  const res = await apiRequest(`/exams/report-cards/student/${studentId}`, { query: { academic_year_id: academicYearId } });
  return unwrap<ReportCard[]>(res) ?? [];
}

export async function getReportCard(cardId: string) {
  return unwrap<ReportCard>(await apiRequest(`/exams/report-cards/${cardId}`));
}

// ── Reading report cards ──
// The report card format isn't documented, so read common field names.

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : null);
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const pick = (card: Record<string, unknown>, ...keys: string[]) => keys.map((k) => card[k]).find((v) => v !== undefined && v !== null);

export function reportCardSummary(card: ReportCard) {
  const published = pick(card, "is_published", "published");
  return {
    percentage: num(pick(card, "percentage", "overall_percentage", "total_percentage")),
    grade: str(pick(card, "grade", "overall_grade")),
    rank: num(pick(card, "rank", "section_rank", "class_rank")),
    obtained: num(pick(card, "total_marks_obtained", "marks_obtained", "total_obtained", "obtained_marks")),
    max: num(pick(card, "total_max_marks", "max_marks", "total_marks")),
    published: typeof published === "boolean" ? published : card.status === "PUBLISHED",
    passed: pick(card, "is_passed", "passed", "result") as boolean | string | undefined,
  };
}

export type ReportCardSubjectRow = {
  subject: string;
  obtained: number | null;
  max: number | null;
  grade: string | null;
  absent: boolean;
};

export function reportCardSubjects(card: ReportCard, subjectName: (id?: string | null) => string): ReportCardSubjectRow[] {
  const list = pick(card, "subjects", "subject_results", "results", "subject_marks");
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      subject: str(item.subject_name) ?? subjectName(str(item.subject_id)),
      obtained: num(pick(item, "marks_obtained", "obtained", "marks")),
      max: num(pick(item, "max_marks", "max")),
      grade: str(item.grade),
      absent: item.is_absent === true,
    }));
}
