"use client";

import { useState } from "react";
import RecordDetailSheet from "./RecordDetailSheet";
import MoodForm, { type MoodFormData, getMoodOption } from "./forms/MoodForm";
import { useUpdateMood, useRemoveMood, type MoodRecord } from "@/features/calendar/queries/useMood";
import { formatDateLabel } from "@/features/calendar/lib/formatRecordDate";

export default function MoodDetailSheet({ record, onClose }: { record: MoodRecord; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const { mutateAsync: updateMood, isPending, error } = useUpdateMood();
  const { mutateAsync: removeMood, isPending: removing } = useRemoveMood();

  const date = new Date(record.date);
  const dateLabel = formatDateLabel(date);
  const option = getMoodOption(record.score);

  async function handleUpdate(data: MoodFormData) {
    await updateMood({ id: record.id, payload: { score: data.score } });
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm("이 기분 기록을 삭제할까요?")) return;
    await removeMood(record.id);
    onClose();
  }

  return (
    <RecordDetailSheet
      onClose={onClose}
      editing={editing}
      onStartEdit={() => setEditing(true)}
      onCancelEdit={() => setEditing(false)}
      title="기분"
      dateLabel={dateLabel}
      editForm={
        <MoodForm
          defaultValues={{ score: record.score }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          isPending={isPending}
          error={error?.message ?? null}
        />
      }
      fields={[{ label: "기분", value: option ? `${option.icon} ${option.label}` : record.score }]}
      onDelete={handleDelete}
      removing={removing}
    />
  );
}
