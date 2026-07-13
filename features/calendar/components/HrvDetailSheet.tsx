"use client";

import { useState } from "react";
import BottomSheet from "@/features/shared/components/BottomSheet";
import { Button } from "@/components/ui/button";
import ExamForm, { type ExamFormData, toDatetimeLocal } from "./forms/ExamForm";
import { useUpdateHrv, useRemoveHrv, type HrvRecord } from "@/features/calendar/queries/useHrv";

interface Props {
  record: HrvRecord;
  onClose: () => void;
}

export default function HrvDetailSheet({ record, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const { mutateAsync: updateHrv, isPending, error } = useUpdateHrv();
  const { mutateAsync: removeHrv, isPending: removing } = useRemoveHrv();

  const date = new Date(record.examinedAt);
  const dateLabel = `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;

  async function handleUpdate(data: ExamFormData) {
    await updateHrv({
      id: record.id,
      payload: { ...data, examinedAt: new Date(data.examinedAt).toISOString() },
    });
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm("이 HRV 검사 기록을 삭제할까요?")) return;
    await removeHrv(record.id);
    onClose();
  }

  if (editing) {
    return (
      <BottomSheet open onOpenChange={(v) => !v && onClose()} title={`HRV 검사 수정 — ${dateLabel}`} onBack={() => setEditing(false)}>
        <div className="pt-4">
          <ExamForm
            defaultDate={date}
            defaultValues={{
              examinedAt: toDatetimeLocal(date),
              hospital: record.hospital ?? "",
              memo: record.memo ?? "",
              mhr: record.mhr,
              sdnn: record.sdnn,
              rmssd: record.rmssd,
              psi: record.psi,
              tp: record.tp,
              vlf: record.vlf,
              lf: record.lf,
              hf: record.hf,
              lfNorm: record.lfNorm,
              hfNorm: record.hfNorm,
              lfHfRatio: record.lfHfRatio,
              ectopicBeat: record.ectopicBeat,
              srd: record.srd,
              result: record.result ?? "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            isPending={isPending}
            error={error?.message ?? null}
          />
        </div>
      </BottomSheet>
    );
  }

  const rows: { label: string; value: number | string | undefined }[] = [
    { label: "MHR", value: record.mhr },
    { label: "SDNN", value: record.sdnn },
    { label: "RMSSD", value: record.rmssd },
    { label: "PSI", value: record.psi },
    { label: "TP", value: record.tp },
    { label: "VLF", value: record.vlf },
    { label: "LF", value: record.lf },
    { label: "HF", value: record.hf },
    { label: "LF Norm", value: record.lfNorm },
    { label: "HF Norm", value: record.hfNorm },
    { label: "LF/HF Ratio", value: record.lfHfRatio },
    { label: "Ectopic Beat", value: record.ectopicBeat },
    { label: "SRD", value: record.srd },
    { label: "결과", value: record.result },
  ];

  return (
    <BottomSheet open onOpenChange={(v) => !v && onClose()} title={`HRV 검사 — ${dateLabel}`}>
      <div className="pt-4 flex flex-col gap-1">
        {record.hospital && (
          <p className="text-xs text-muted-foreground mb-2">병원: {record.hospital}</p>
        )}
        {record.memo && (
          <p className="text-xs text-muted-foreground mb-3">메모: {record.memo}</p>
        )}
        {rows.map(({ label, value }) =>
          value !== undefined && value !== null ? (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ) : null
        )}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => setEditing(true)}>
            수정
          </Button>
          <Button variant="outline" className="flex-1 text-destructive" onClick={handleDelete} disabled={removing}>
            {removing ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
