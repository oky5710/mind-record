"use client";

import { useState } from "react";
import Navigation from "@/features/shared/components/Navigation";
import BottomSheet from "@/features/shared/components/BottomSheet";
import LoadingIndicator from "@/features/shared/components/LoadingIndicator";
import {
  useMedications,
  useAddMedication,
  useRemoveMedication,
  useDrugSearch,
  DOSE_TIMING_LABELS,
  type DoseTiming,
  type DrugItem,
  type Medication,
} from "@/features/medicine/queries/useMedications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function MedicationCard({ medication }: { medication: Medication }) {
  const { mutate: remove, isPending } = useRemoveMedication();

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card">
      {medication.itemImage ? (
        <img
          src={medication.itemImage}
          alt={medication.name}
          className="w-16 h-8 object-contain rounded shrink-0 bg-muted"
        />
      ) : (
        <div className="w-16 h-8 rounded shrink-0 bg-muted flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">이미지 없음</span>
        </div>
      )}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-medium truncate">{medication.name}</span>
        {medication.entpName && (
          <span className="text-xs text-muted-foreground truncate">{medication.entpName}</span>
        )}
        {(medication.drugShape || medication.colorClass) && (
          <span className="text-xs text-muted-foreground truncate">
            {[medication.drugShape, medication.colorClass].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
      <button
        onClick={() => remove(medication.id)}
        disabled={isPending}
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        aria-label="삭제"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
        </svg>
      </button>
    </div>
  );
}

const ALL_TIMINGS: DoseTiming[] = ["MORNING", "LUNCH", "DINNER", "BEDTIME", "AS_NEEDED"];

function TimingAccordion({ timing, medications }: { timing: DoseTiming | "NONE"; medications: Medication[] }) {
  const [open, setOpen] = useState(true);
  const label = timing === "NONE" ? "미설정" : DOSE_TIMING_LABELS[timing];

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <span className="text-sm font-semibold">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{medications.length}개</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={["transition-transform duration-200", open ? "rotate-180" : ""].join(" ")}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="flex flex-col divide-y divide-border">
          {medications.map((med) => (
            <MedicationCard key={med.id} medication={med} />
          ))}
        </div>
      )}
    </div>
  );
}

function DrugSearchSheet({
  open,
  onOpenChange,
  activeMedications,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeMedications: Medication[];
}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<DrugItem | null>(null);
  const [timings, setTimings] = useState<DoseTiming[]>([]);

  const { data: searchResult, isLoading: searching, error: searchError } = useDrugSearch(searchTerm);
  const { mutate: addMedication, isPending: adding } = useAddMedication();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
  }

  function toggleTiming(t: DoseTiming) {
    setTimings((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function handleConfirm() {
    if (!selectedDrug) return;
    addMedication(
      {
        name: selectedDrug.itemName,
        itemSeq: selectedDrug.itemSeq,
        entpName: selectedDrug.entpName,
        itemImage: selectedDrug.itemImage,
        drugShape: selectedDrug.drugShape,
        colorClass: selectedDrug.colorClass,
        chart: selectedDrug.chart,
        timings,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      }
    );
  }

  function reset() {
    setSearchInput("");
    setSearchTerm("");
    setSelectedDrug(null);
    setTimings([]);
  }

  function handleOpenChange(value: boolean) {
    if (!value) reset();
    onOpenChange(value);
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={selectedDrug ? "복용 시간 선택" : "복용약 추가"}
      onBack={selectedDrug ? () => setSelectedDrug(null) : undefined}
    >
      {selectedDrug ? (
        <div className="pt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/40">
            {selectedDrug.itemImage && (
              <img src={selectedDrug.itemImage} alt={selectedDrug.itemName} className="w-14 h-7 object-contain rounded shrink-0" />
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium truncate">{selectedDrug.itemName}</span>
              <span className="text-xs text-muted-foreground truncate">{selectedDrug.entpName}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {ALL_TIMINGS.map((t) => {
              const active = timings.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTiming(t)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left w-full"
                >
                  <span className={[
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    active ? "bg-primary border-primary" : "border-border bg-card",
                  ].join(" ")}>
                    {active && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className="text-sm">{DOSE_TIMING_LABELS[t]}</span>
                </button>
              );
            })}
          </div>

          <Button onClick={handleConfirm} disabled={adding || timings.length === 0} className="w-full">
            {adding ? "등록 중..." : "등록"}
          </Button>
        </div>
      ) : (
        <div className="pt-4 flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="약 이름 검색"
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={!searchInput.trim() || searching}>
              검색
            </Button>
          </form>

          {searching && (
            <p className="text-sm text-muted-foreground text-center py-6">검색 중...</p>
          )}
          {searchError && (
            <p className="text-sm text-destructive text-center py-6">검색에 실패했습니다.</p>
          )}
          {searchResult && !searching && searchResult.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">검색 결과가 없습니다.</p>
          )}
          {searchResult?.items.map((item) => {
            const isActive = activeMedications.some((m) => m.itemSeq === item.itemSeq);
            return (
            <button
              key={item.itemSeq}
              onClick={() => { if (!isActive) { setSelectedDrug(item); setTimings([]); } }}
              disabled={isActive}
              className={[
                "flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card text-left w-full transition-colors",
                isActive ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 active:bg-muted",
              ].join(" ")}
            >
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{item.itemName}</span>
                <span className="text-xs text-muted-foreground truncate">{item.entpName}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {isActive ? "복용 중" : "선택 ›"}
              </span>
            </button>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}

export default function MedicinePage() {
  const [open, setOpen] = useState(false);
  const { data: medications, isLoading, error } = useMedications();

  const groups = [...ALL_TIMINGS, "NONE" as const]
    .map((timing) => ({
      timing,
      medications: (medications ?? []).filter((m) =>
        timing === "NONE" ? m.timings.length === 0 : m.timings.includes(timing as DoseTiming)
      ),
    }))
    .filter((g) => g.medications.length > 0);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 max-w-md lg:max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-3 pb-28">
        {isLoading && <LoadingIndicator />}
        {error && (
          <p className="text-sm text-destructive text-center py-10">목록을 불러오지 못했습니다.</p>
        )}
        {!isLoading && !error && medications?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            등록된 약이 없습니다.
            <br />
            아래 버튼으로 복용약을 추가하세요.
          </p>
        )}
        {groups.map(({ timing, medications: meds }) => (
          <TimingAccordion key={timing} timing={timing} medications={meds} />
        ))}
      </main>

      <div className="fixed bottom-6 left-0 right-0 px-4 max-w-md lg:max-w-4xl mx-auto">
        <Button className="w-full" onClick={() => setOpen(true)}>
          + 약 추가
        </Button>
      </div>

      <DrugSearchSheet open={open} onOpenChange={setOpen} activeMedications={medications ?? []} />
    </div>
  );
}
