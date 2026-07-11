"use client";

import BottomSheet from "@/features/shared/components/BottomSheet";
import type { HrvRecord } from "@/features/calendar/queries/useHrv";

interface Props {
  record: HrvRecord;
  onClose: () => void;
}

export default function HrvDetailSheet({ record, onClose }: Props) {
  const date = new Date(record.examinedAt);
  const dateLabel = `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;

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
      </div>
    </BottomSheet>
  );
}
