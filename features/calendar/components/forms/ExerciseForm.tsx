"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ExerciseType = "유산소" | "근력 운동" | "직접입력";

export interface ExerciseFormData {
  exerciseType: ExerciseType;
  customTitle: string;
  durationMinutes: number;
  intensity: number;
}

const EXERCISE_TYPES: ExerciseType[] = ["유산소", "근력 운동", "직접입력"];
const INTENSITY_LABELS = ["", "매우 쉬움", "쉬움", "보통", "힘듦", "매우 힘듦"];

interface Props {
  onSubmit: (data: ExerciseFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
  error?: string | null;
}

export default function ExerciseForm({ onSubmit, onCancel, isPending, error }: Props) {
  const [exerciseType, setExerciseType] = useState<ExerciseType>("유산소");
  const [customTitle, setCustomTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [intensity, setIntensity] = useState<number>(3);
  const [submitted, setSubmitted] = useState(false);

  const titleError = submitted && exerciseType === "직접입력" && !customTitle.trim();
  const durationError = submitted && (durationMinutes === "" || Number(durationMinutes) <= 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (titleError || durationError) return;
    if (durationMinutes === "" || Number(durationMinutes) <= 0) return;
    if (exerciseType === "직접입력" && !customTitle.trim()) return;
    onSubmit({
      exerciseType,
      customTitle: customTitle.trim(),
      durationMinutes: Number(durationMinutes),
      intensity,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 운동 종류 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">운동 종류</span>
        <div className="flex flex-col gap-1">
          {EXERCISE_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <span className={[
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                exerciseType === type ? "border-primary" : "border-muted-foreground/40",
              ].join(" ")}>
                {exerciseType === type && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </span>
              <span className="text-sm">{type}</span>
              <input
                type="radio"
                className="sr-only"
                value={type}
                checked={exerciseType === type}
                onChange={() => setExerciseType(type)}
              />
            </label>
          ))}
        </div>
        {exerciseType === "직접입력" && (
          <Input
            placeholder="운동 이름 입력"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className={titleError ? "border-destructive" : ""}
            autoFocus
          />
        )}
        {titleError && (
          <p className="text-xs text-destructive">운동 이름을 입력해주세요.</p>
        )}
      </div>

      {/* 시간 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">운동 시간</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            placeholder="0"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
            className={["w-28 text-right", durationError ? "border-destructive" : ""].join(" ")}
          />
          <span className="text-sm text-muted-foreground">분</span>
        </div>
        {durationError && (
          <p className="text-xs text-destructive">운동 시간을 입력해주세요.</p>
        )}
      </div>

      {/* 강도 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">운동 강도</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setIntensity(v)}
              className={[
                "flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                intensity === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">{INTENSITY_LABELS[intensity]}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
