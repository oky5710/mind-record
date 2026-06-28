"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import BottomSheet from "@/features/shared/components/BottomSheet";
import ExamForm, { type ExamFormData } from "./forms/ExamForm";
import ExerciseForm, { type ExerciseFormData } from "./forms/ExerciseForm";
import { useCreateHrv, type HrvPayload } from "@/features/calendar/queries/useHrv";
import { useCreateExercise } from "@/features/calendar/queries/useExercise";

type EntryType = "검사" | "운동" | "기분" | "이벤트";

const ENTRY_TYPES: { value: EntryType; label: string; description: string }[] = [
  { value: "검사", label: "검사", description: "정신과 검사 결과 기록" },
  { value: "운동", label: "운동", description: "운동 종류 및 시간 기록" },
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

function buildHrvPayload(data: ExamFormData): HrvPayload {
  return {
    examinedAt: new Date(data.examinedAt).toISOString(),
    ...(data.hospital ? { hospital: data.hospital } : {}),
    ...(data.memo ? { memo: data.memo } : {}),
    mhr: data.mhr, sdnn: data.sdnn, rmssd: data.rmssd, psi: data.psi,
    tp: data.tp, vlf: data.vlf, lf: data.lf, hf: data.hf,
    lfNorm: data.lfNorm, hfNorm: data.hfNorm, lfHfRatio: data.lfHfRatio,
    ectopicBeat: data.ectopicBeat, srd: data.srd, result: data.result,
  };
}

export default function EntryModal({ date, onClose }: Props) {
  const [selected, setSelected] = useState<EntryType | null>(null);
  const { mutateAsync, isPending, error } = useCreateHrv();
  const { mutateAsync: createExercise, isPending: exercisePending, error: exerciseError } = useCreateExercise();

  function handleOpenChange(open: boolean) {
    if (!open) onClose();
  }

  async function handleExamSubmit(data: ExamFormData) {
    await mutateAsync(buildHrvPayload(data));
    onClose();
  }

  async function handleExerciseSubmit(data: ExerciseFormData) {
    const type = data.exerciseType === "직접입력" ? data.customTitle : data.exerciseType;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    await createExercise({
      date: dateStr,
      type,
      durationMinutes: data.durationMinutes,
      intensity: data.intensity,
    });
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
            <ExamForm
              defaultDate={date}
              onSubmit={handleExamSubmit}
              onCancel={onClose}
              isPending={isPending}
              error={error?.message ?? null}
            />
          )}
          {selected === "운동" && (
            <ExerciseForm
              onSubmit={handleExerciseSubmit}
              onCancel={onClose}
              isPending={exercisePending}
              error={exerciseError?.message ?? null}
            />
          )}
          {(selected === "기분" || selected === "이벤트") && (
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
