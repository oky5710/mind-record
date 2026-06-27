"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  maxHeight?: string;
}

export default function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  onBack,
  maxHeight = "90dvh",
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-w-md mx-auto p-0 flex flex-col"
        style={{ maxHeight }}
      >
        {/* 고정 헤더 */}
        <SheetHeader className="flex-row items-center gap-1 px-3 py-3 border-b border-border shrink-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onBack}
              aria-label="뒤로가기"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <SheetTitle className="text-base text-left">{title}</SheetTitle>
        </SheetHeader>

        {/* 스크롤 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
