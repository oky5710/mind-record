"use client";

import { useState } from "react";
import RecordDetailSheet from "./RecordDetailSheet";
import ExerciseForm, { type ExerciseFormData } from "./forms/ExerciseForm";
import { useUpdateExercise, useRemoveExercise, type ExerciseRecord } from "@/features/calendar/queries/useExercise";
import { formatDateLabel } from "@/features/calendar/lib/formatRecordDate";

const INTENSITY_LABELS = ["", "매우 쉬움", "쉬움", "보통", "힘듦", "매우 힘듦"];

export default function ExerciseDetailSheet({ record, onClose }: { record: ExerciseRecord; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const { mutateAsync: updateExercise, isPending, error } = useUpdateExercise();
  const { mutateAsync: removeExercise, isPending: removing } = useRemoveExercise();

  const date = new Date(record.date);
  const dateLabel = formatDateLabel(date);

  async function handleUpdate(data: ExerciseFormData) {
    const type = data.exerciseType === "직접입력" ? data.customTitle : data.exerciseType;
    await updateExercise({
      id: record.id,
      payload: { type, durationMinutes: data.durationMinutes, intensity: data.intensity },
    });
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm("이 운동 기록을 삭제할까요?")) return;
    await removeExercise(record.id);
    onClose();
  }

  return (
    <RecordDetailSheet
      onClose={onClose}
      editing={editing}
      onStartEdit={() => setEditing(true)}
      onCancelEdit={() => setEditing(false)}
      title="운동"
      dateLabel={dateLabel}
      editForm={
        <ExerciseForm
          defaultValues={{ type: record.type, durationMinutes: record.durationMinutes, intensity: record.intensity }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          isPending={isPending}
          error={error?.message ?? null}
        />
      }
      fields={[
        { label: "종류", value: record.type },
        { label: "시간", value: `${record.durationMinutes}분` },
        record.intensity != null
          ? { label: "강도", value: `${record.intensity} (${INTENSITY_LABELS[record.intensity]})` }
          : { label: "강도", value: undefined },
      ]}
      onDelete={handleDelete}
      removing={removing}
    />
  );
}
