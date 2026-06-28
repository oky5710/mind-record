"use client";

import { useState } from "react";
import Navigation from "@/features/shared/components/Navigation";
import BottomSheet from "@/features/shared/components/BottomSheet";
import {
  useMedications,
  useAddMedication,
  useRemoveMedication,
  useDrugSearch,
  type DrugItem,
  type Medication,
} from "@/features/medicine/queries/useMedications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function MedicationCard({ medication }: { medication: Medication }) {
  const { mutate: remove, isPending } = useRemoveMedication();

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-medium truncate">{medication.name}</span>
        {medication.entpName && (
          <span className="text-xs text-muted-foreground truncate">{medication.entpName}</span>
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

function DrugSearchSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResult, isLoading: searching, error: searchError } = useDrugSearch(searchTerm);
  const { mutate: addMedication, isPending: adding } = useAddMedication();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
  }

  function handleSelect(item: DrugItem) {
    addMedication(
      { name: item.itemName, itemSeq: item.itemSeq, entpName: item.entpName },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSearchInput("");
          setSearchTerm("");
        },
      }
    );
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setSearchInput("");
      setSearchTerm("");
    }
    onOpenChange(value);
  }

  return (
    <BottomSheet open={open} onOpenChange={handleOpenChange} title="복용약 추가">
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
        {searchResult?.items.map((item) => (
          <button
            key={item.itemSeq}
            onClick={() => handleSelect(item)}
            disabled={adding}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 active:bg-muted transition-colors text-left w-full disabled:opacity-50"
          >
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{item.itemName}</span>
              <span className="text-xs text-muted-foreground truncate">{item.entpName}</span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">추가 ›</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

export default function MedicinePage() {
  const [open, setOpen] = useState(false);
  const { data: medications, isLoading, error } = useMedications();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 flex flex-col gap-3 pb-28">
        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-10">불러오는 중...</p>
        )}
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
        {medications?.map((med) => (
          <MedicationCard key={med.id} medication={med} />
        ))}
      </main>

      <div className="fixed bottom-6 left-0 right-0 px-4 max-w-md mx-auto">
        <Button className="w-full" onClick={() => setOpen(true)}>
          + 약 추가
        </Button>
      </div>

      <DrugSearchSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}
