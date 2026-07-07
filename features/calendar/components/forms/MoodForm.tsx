"use client";

import { Button } from "@/components/ui/button";

export const MOOD_OPTIONS = [
  { score: 1, icon: "😞", label: "매우 나쁨" },
  { score: 2, icon: "😕", label: "나쁨" },
  { score: 3, icon: "😐", label: "보통" },
  { score: 4, icon: "🙂", label: "좋음" },
  { score: 5, icon: "😄", label: "매우 좋음" },
];

export interface MoodFormData {
  score: number;
}

interface Props {
  onSubmit: (data: MoodFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
  error?: string | null;
}

export default function MoodForm({ onSubmit, onCancel, isPending, error }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">오늘 기분이 어때요?</span>
        <div className="flex justify-between gap-2">
          {MOOD_OPTIONS.map(({ score, icon, label }) => (
            <button
              key={score}
              type="button"
              disabled={isPending}
              onClick={() => onSubmit({ score })}
              className="flex flex-col items-center gap-1.5 flex-1 disabled:opacity-50"
            >
              <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-2xl border-2 border-border bg-card hover:bg-muted hover:scale-110 transition-all">
                {icon}
              </span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
        취소
      </Button>
    </div>
  );
}
