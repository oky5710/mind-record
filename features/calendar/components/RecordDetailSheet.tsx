"use client";

import type { ReactNode } from "react";
import BottomSheet from "@/features/shared/components/BottomSheet";
import { Button } from "@/components/ui/button";

export interface DetailField {
  label: string;
  value: ReactNode;
}

interface Props {
  onClose: () => void;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  title: string;
  dateLabel: string;
  editForm: ReactNode;
  fields: DetailField[];
  onDelete: () => void;
  removing: boolean;
}

/** 기록 상세보기/수정/삭제 바텀시트 공통 셸 (커피/운동/이벤트/기분 상세 시트가 공유) */
export default function RecordDetailSheet({
  onClose,
  editing,
  onStartEdit,
  onCancelEdit,
  title,
  dateLabel,
  editForm,
  fields,
  onDelete,
  removing,
}: Props) {
  if (editing) {
    return (
      <BottomSheet
        open
        onOpenChange={(v) => !v && onClose()}
        title={`${title} 수정 — ${dateLabel}`}
        onBack={onCancelEdit}
      >
        <div className="pt-4">{editForm}</div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open onOpenChange={(v) => !v && onClose()} title={`${title} — ${dateLabel}`}>
      <div className="pt-4 flex flex-col gap-1">
        {fields
          .filter(({ value }) => value !== undefined)
          .map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onStartEdit}>
            수정
          </Button>
          <Button variant="outline" className="flex-1 text-destructive" onClick={onDelete} disabled={removing}>
            {removing ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
