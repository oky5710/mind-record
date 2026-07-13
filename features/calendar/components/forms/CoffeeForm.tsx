"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COFFEE_TYPES = ["아메리카노", "라떼", "카푸치노", "에스프레소", "콜드브루", "직접입력"] as const;
type CoffeeType = (typeof COFFEE_TYPES)[number];

export interface CoffeeFormData {
  coffeeType: CoffeeType;
  customType: string;
  time: string;
  memo: string;
}

interface Props {
  onSubmit: (data: CoffeeFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
  error?: string | null;
  defaultValues?: { type?: string; time?: string; memo?: string };
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function CoffeeForm({ onSubmit, onCancel, isPending, error, defaultValues }: Props) {
  const initialType = defaultValues?.type;
  const isKnownType = (COFFEE_TYPES as readonly string[]).includes(initialType ?? "") && initialType !== "직접입력";
  const [coffeeType, setCoffeeType] = useState<CoffeeType>(
    isKnownType ? (initialType as CoffeeType) : initialType ? "직접입력" : "아메리카노"
  );
  const [customType, setCustomType] = useState(isKnownType ? "" : initialType ?? "");
  const [time, setTime] = useState(defaultValues?.time ?? getCurrentTime());
  const [memo, setMemo] = useState(defaultValues?.memo ?? "");
  const [submitted, setSubmitted] = useState(false);

  const typeError = submitted && coffeeType === "직접입력" && !customType.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (coffeeType === "직접입력" && !customType.trim()) return;
    onSubmit({ coffeeType, customType: customType.trim(), time, memo: memo.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 커피 종류 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">커피 종류</span>
        <div className="grid grid-cols-2 gap-1.5">
          {COFFEE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setCoffeeType(type)}
              className={[
                "py-2 px-3 rounded-lg text-sm border transition-colors text-left",
                coffeeType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {type}
            </button>
          ))}
        </div>
        {coffeeType === "직접입력" && (
          <Input
            placeholder="커피 이름 입력"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            className={typeError ? "border-destructive" : ""}
            autoFocus
          />
        )}
        {typeError && <p className="text-xs text-destructive">커피 이름을 입력해주세요.</p>}
      </div>

      {/* 시간 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">시간</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* 메모 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">메모</span>
        <Input
          placeholder="출근길, 카페 미팅 등"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
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
