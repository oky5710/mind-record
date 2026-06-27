"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import BottomSheet from "./BottomSheet";
import ExamForm, { type ExamFormData } from "./forms/ExamForm";

type EntryType = "검사" | "기분" | "이벤트";

const ENTRY_TYPES: { value: EntryType; label: string; description: string }[] = [
  { value: "검사", label: "검사", description: "정신과 검사 결과 기록" },
  { value: "기분", label: "기분", description: "오늘의 기분 및 상태" },
  { value: "이벤트", label: "이벤트", description: "정신건강에 영향을 준 사건" },
];

interface Props {
  date: Date;
  onClose: () => void;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export default function EntryModal({ date, onClose }: Props) {
  const [selected, setSelected] = useState<EntryType | null>(null);

  function handleOpenChange(open: boolean) {
    if (!open) onClose();
  }

  function handleExamSubmit(data: ExamFormData) {
    console.log("검사 저장:", { date, ...data });
    onClose();
  }

  const title = selected ? `${formatDate(date)} · ${selected}` : formatDate(date);

  return (
    <BottomSheet
      open
      onOpenChange={handleOpenChange}
      title={title}
      onBack={selected !== null ? () => setSelected(null) : undefined}
    >
      {selected === null ? (
        <div className="pt-5 flex flex-col gap-3">
          {ENTRY_TYPES.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 active:bg-muted transition-colors text-left w-full"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
              <span className="ml-auto text-muted-foreground">›</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="pt-5">
          {selected === "검사" && (
            <ExamForm onSubmit={handleExamSubmit} onCancel={onClose} />
          )}
          {selected !== "검사" && (
            <>
              <div className="rounded-xl bg-muted border border-border p-5 text-center text-sm text-muted-foreground">
                {selected} 입력 폼 — 추후 구현 예정
              </div>
              <Button variant="outline" className="mt-5 w-full" onClick={onClose}>
                닫기
              </Button>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
