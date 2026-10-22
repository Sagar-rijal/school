"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Alert, Field, Select } from "@/components/form";
import { Card, EmptyState, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { ACTIVITY_CATEGORIES, createStudentActivity, listStudentActivities, type ActivityCategory } from "@/lib/activities";
import { formatEnum, getErrorMessage, todayInput } from "@/lib/utils";

export default function ActivitiesCard({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const [category, setCategory] = useState<ActivityCategory | "">("");
  const activities = useQuery(`student-activities:${studentId}:${category}`, () => listStudentActivities(studentId, category || undefined));
  const [formCategory, setFormCategory] = useState<ActivityCategory>("ACADEMIC");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState("");
  const [date, setDate] = useState(todayInput());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      await createStudentActivity({ student_id: studentId, category: formCategory, title: title.trim(),
        description: description.trim(), rating_or_score: rating.trim() || null, event_date: new Date(`${date}T12:00:00`).toISOString() });
      setTitle(""); setDescription(""); setRating(""); setMessage("Activity added."); activities.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not add activity")); }
    finally { setBusy(false); }
  };

  return <Card title="Activities">
    <div className="space-y-4">
      {(activities.error || error) && <Alert type="error">{activities.error || error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      <Select aria-label="Activity category" value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory | "")} className="max-w-xs"><option value="">All categories</option>{ACTIVITY_CATEGORIES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select>
      {activities.loading ? <Loading /> : (activities.data?.length ?? 0) === 0 ? <EmptyState>No activities recorded.</EmptyState> : <ul className="divide-y rounded-md border">{activities.data?.map((item, index) => <li key={item.id ?? item._id ?? index} className="p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{item.title}</span><span className="text-muted-foreground">{formatEnum(item.category)} · {new Date(item.event_date).toLocaleDateString()}</span></div><p className="mt-1 text-muted-foreground">{item.description}</p>{item.rating_or_score && <p className="mt-1">Rating/score: {item.rating_or_score}</p>}</li>)}</ul>}
      {canManage && <form onSubmit={submit} className="space-y-3 border-t pt-4"><h3 className="font-medium">Add activity</h3><div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category" htmlFor="activity-category"><Select id="activity-category" value={formCategory} onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}>{ACTIVITY_CATEGORIES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select></Field>
        <Field label="Date" htmlFor="activity-date" required><Input id="activity-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Title" htmlFor="activity-title" required><Input id="activity-title" required value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Rating or score" htmlFor="activity-rating"><Input id="activity-rating" value={rating} onChange={(e) => setRating(e.target.value)} /></Field>
      </div><Field label="Description" htmlFor="activity-description" required><textarea id="activity-description" rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Add activity"}</Button></form>}
    </div>
  </Card>;
}
