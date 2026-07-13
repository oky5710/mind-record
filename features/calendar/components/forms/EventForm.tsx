"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EventType } from "@/features/calendar/queries/useEvents";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  MEDICATION_CHANGE: "약 변경",
  RELATIONSHIP_ISSUE: "대인관계 문제",
  WORK_STRESS: "업무 스트레스",
  HOSPITAL_VISIT: "병원 진료",
  OTHER: "기타",
};

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = (
  Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]
).map(([value, label]) => ({ value, label }));

export interface EventFormData {
  type: EventType;
  customTitle: string;
  description: string;
}

interface Props {
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
  error?: string | null;
}

export default function EventForm({ onSubmit, onCancel, isPending, error }: Props) {
  const [type, setType] = useState<EventType>("MEDICATION_CHANGE");
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const titleError = submitted && type === "OTHER" && !customTitle.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (type === "OTHER" && !customTitle.trim()) return;
    onSubmit({ type, customTitle: customTitle.trim(), description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 유형 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">유형</span>
        <div className="flex flex-col gap-1">
          {EVENT_TYPE_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <span className={[
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                type === value ? "border-primary" : "border-muted-foreground/40",
              ].join(" ")}>
                {type === value && <span className="w-2 h-2 rounded-full bg-primary" />}
              </span>
              <span className="text-sm">{label}</span>
              <input
                type="radio"
                className="sr-only"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
              />
            </label>
          ))}
        </div>
        {type === "OTHER" && (
          <Input
            placeholder="어떤 일이었는지 입력"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className={titleError ? "border-destructive" : ""}
            autoFocus
          />
        )}
        {titleError && <p className="text-xs text-destructive">내용을 입력해주세요.</p>}
      </div>

      {/* 설명 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">설명</span>
        <Textarea
          placeholder="자세한 내용을 입력해주세요 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
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
