"use client";

import { useState } from "react";
import RecordDetailSheet from "./RecordDetailSheet";
import EventForm, { type EventFormData, EVENT_TYPE_LABELS } from "./forms/EventForm";
import { useUpdateEvent, useRemoveEvent, type EventRecord } from "@/features/calendar/queries/useEvents";
import { formatDateLabel, formatTimeLabel } from "@/features/calendar/lib/formatRecordDate";

export default function EventDetailSheet({ record, onClose }: { record: EventRecord; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const { mutateAsync: updateEvent, isPending, error } = useUpdateEvent();
  const { mutateAsync: removeEvent, isPending: removing } = useRemoveEvent();

  const date = new Date(record.date);
  const dateLabel = formatDateLabel(date);
  const timeLabel = formatTimeLabel(date);

  async function handleUpdate(data: EventFormData) {
    const [hours, minutes] = data.time.split(":").map(Number);
    const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    const title = data.type === "OTHER" ? data.customTitle : EVENT_TYPE_LABELS[data.type];
    await updateEvent({
      id: record.id,
      payload: { date: dateObj.toISOString(), type: data.type, title, description: data.description },
    });
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm("이 이벤트 기록을 삭제할까요?")) return;
    await removeEvent(record.id);
    onClose();
  }

  return (
    <RecordDetailSheet
      onClose={onClose}
      editing={editing}
      onStartEdit={() => setEditing(true)}
      onCancelEdit={() => setEditing(false)}
      title="이벤트"
      dateLabel={dateLabel}
      editForm={
        <EventForm
          defaultValues={{ type: record.type, title: record.title, description: record.description, time: timeLabel }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          isPending={isPending}
          error={error?.message ?? null}
        />
      }
      fields={[
        { label: "유형", value: EVENT_TYPE_LABELS[record.type] },
        { label: "제목", value: record.title },
        { label: "시간", value: timeLabel },
        { label: "설명", value: record.description },
      ]}
      onDelete={handleDelete}
      removing={removing}
    />
  );
}
