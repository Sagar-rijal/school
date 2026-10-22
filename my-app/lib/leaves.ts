import { apiRequest, unwrap, unwrapPage } from "./api";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveApplication = {
  _id?: string;
  id?: string;
  application_id?: string;
  student_id?: string | null;
  applicant_id?: string;
  leave_type?: string;
  reason?: string;
  start_date?: string;
  end_date?: string;
  status?: LeaveStatus;
  reviewer_remarks?: string | null;
  created_at?: string;
};

export async function listLeaveApplications(status?: LeaveStatus) {
  return unwrapPage<LeaveApplication>(await apiRequest("/leaves", { query: { status } })).items;
}

export async function getLeaveApplication(id: string) {
  return unwrap<LeaveApplication>(await apiRequest(`/leaves/${encodeURIComponent(id)}`));
}

export function reviewLeaveApplication(id: string, status: "APPROVED" | "REJECTED", reviewer_remarks?: string) {
  return apiRequest(`/leaves/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: { status, reviewer_remarks: reviewer_remarks || null },
  });
}
