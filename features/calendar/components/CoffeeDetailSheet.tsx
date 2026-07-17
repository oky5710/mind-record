"use client";

import { useState } from "react";
import RecordDetailSheet from "./RecordDetailSheet";
import CoffeeForm, { type CoffeeFormData } from "./forms/CoffeeForm";
import { useUpdateCoffee, useRemoveCoffee, type CoffeeRecord } from "@/features/calendar/queries/useCoffee";
import { formatDateLabel, formatTimeLabel } from "@/features/calendar/lib/formatRecordDate";

export default function CoffeeDetailSheet({ record, onClose }: { record: CoffeeRecord; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const { mutateAsync: updateCoffee, isPending, error } = useUpdateCoffee();
  const { mutateAsync: removeCoffee, isPending: removing } = useRemoveCoffee();

  const date = new Date(record.date);
  const dateLabel = formatDateLabel(date);
  const timeLabel = formatTimeLabel(date);

  async function handleUpdate(data: CoffeeFormData) {
    const type = data.coffeeType === "직접입력" ? data.customType : data.coffeeType;
    const [hours, minutes] = data.time.split(":").map(Number);
    const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    await updateCoffee({
      id: record.id,
      payload: { date: dateObj.toISOString(), type, memo: data.memo },
    });
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm("이 커피 기록을 삭제할까요?")) return;
    await removeCoffee(record.id);
    onClose();
  }

  return (
    <RecordDetailSheet
      onClose={onClose}
      editing={editing}
      onStartEdit={() => setEditing(true)}
      onCancelEdit={() => setEditing(false)}
      title="커피"
      dateLabel={dateLabel}
      editForm={
        <CoffeeForm
          defaultValues={{ type: record.type, time: timeLabel, memo: record.memo }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          isPending={isPending}
          error={error?.message ?? null}
        />
      }
      fields={[
        { label: "종류", value: record.type },
        { label: "시간", value: timeLabel },
        { label: "메모", value: record.memo },
      ]}
      onDelete={handleDelete}
      removing={removing}
    />
  );
}
