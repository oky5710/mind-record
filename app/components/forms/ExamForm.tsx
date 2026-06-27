"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type ExamFormData = {
  // Time Domain Analysis
  mhr: number | "";
  sdnn: number | "";
  rmssd: number | "";
  psi: number | "";
  // Frequency Domain Analysis
  tp1: number | "";
  tp2: number | "";
  vlf1: number | "";
  vlf2: number | "";
  lf1: number | "";
  lf2: number | "";
  hf1: number | "";
  hf2: number | "";
  lfNorm: number | "";
  hfNorm: number | "";
  lfHfRatio: number | "";
  ectopicBeat: number | "";
  // Other
  srd: number | "";
  result: string;
};

interface Props {
  onSubmit: (data: ExamFormData) => void;
  onCancel: () => void;
}

function NumberField({ label, name, register }: {
  label: string;
  name: keyof ExamFormData;
  register: ReturnType<typeof useForm<ExamFormData>>["register"];
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step="any"
        className="h-8 text-sm"
        {...register(name, { valueAsNumber: true })}
      />
    </div>
  );
}

function DualNumberField({ label, name1, name2, register }: {
  label: string;
  name1: keyof ExamFormData;
  name2: keyof ExamFormData;
  register: ReturnType<typeof useForm<ExamFormData>>["register"];
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2 flex-1">
        <Input
          type="number"
          step="any"
          className="h-8 text-sm"
          {...register(name1, { valueAsNumber: true })}
        />
        <Input
          type="number"
          step="any"
          className="h-8 text-sm"
          {...register(name2, { valueAsNumber: true })}
        />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-foreground uppercase tracking-wide pt-1">
      {children}
    </p>
  );
}

export default function ExamForm({ onSubmit, onCancel }: Props) {
  const { register, handleSubmit } = useForm<ExamFormData>({
    defaultValues: {
      mhr: "", sdnn: "", rmssd: "", psi: "",
      tp1: "", tp2: "", vlf1: "", vlf2: "",
      lf1: "", lf2: "", hf1: "", hf2: "",
      lfNorm: "", hfNorm: "", lfHfRatio: "", ectopicBeat: "",
      srd: "", result: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <SectionTitle>Time Domain Analysis</SectionTitle>
      <NumberField label="MHR" name="mhr" register={register} />
      <NumberField label="SDNN" name="sdnn" register={register} />
      <NumberField label="RMSSD" name="rmssd" register={register} />
      <NumberField label="PSI" name="psi" register={register} />

      <Separator />

      <SectionTitle>Frequency Domain Analysis</SectionTitle>
      <DualNumberField label="TP" name1="tp1" name2="tp2" register={register} />
      <DualNumberField label="VLF" name1="vlf1" name2="vlf2" register={register} />
      <DualNumberField label="LF" name1="lf1" name2="lf2" register={register} />
      <DualNumberField label="HF" name1="hf1" name2="hf2" register={register} />
      <NumberField label="LFNorm" name="lfNorm" register={register} />
      <NumberField label="HFNorm" name="hfNorm" register={register} />
      <NumberField label="LF/HF Ratio" name="lfHfRatio" register={register} />
      <NumberField label="Ectopic Beat" name="ectopicBeat" register={register} />

      <Separator />

      <SectionTitle>Other</SectionTitle>
      <NumberField label="SRD" name="srd" register={register} />
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Result</Label>
        <Textarea
          rows={3}
          className="text-sm resize-none"
          {...register("result")}
        />
      </div>

      <div className="flex gap-3 pt-2 pb-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" className="flex-1">
          저장
        </Button>
      </div>
    </form>
  );
}
