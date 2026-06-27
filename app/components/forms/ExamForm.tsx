"use client";

import { useForm, type FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type ExamFormData = {
  examinedAt: string;
  hospital: string;
  memo: string;
  // Time Domain Analysis
  mhr: number;
  sdnn: number;
  rmssd: number;
  psi: number;
  // Frequency Domain Analysis
  tp: number;
  tpLog: number;
  vlf: number;
  vlfLog: number;
  lf: number;
  lfLog: number;
  hf: number;
  hfLog: number;
  lfNorm: number;
  hfNorm: number;
  lfHfRatio: number;
  ectopicBeat: number;
  // Other
  srd: number;
  result: string;
};

interface Props {
  defaultDate: Date;
  onSubmit: (data: ExamFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
  error?: string | null;
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function NumberField({ label, name, register, errors }: {
  label: string;
  name: keyof ExamFormData;
  register: ReturnType<typeof useForm<ExamFormData>>["register"];
  errors: FieldErrors<ExamFormData>;
}) {
  const hasError = !!errors[name];
  return (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step="any"
        className={`h-8 text-sm ${hasError ? "border-destructive" : ""}`}
        {...register(name, { required: true, valueAsNumber: true })}
      />
    </div>
  );
}

function DualNumberField({ label, name1, name2, register, errors }: {
  label: string;
  name1: keyof ExamFormData;
  name2: keyof ExamFormData;
  register: ReturnType<typeof useForm<ExamFormData>>["register"];
  errors: FieldErrors<ExamFormData>;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2 flex-1">
        <Input
          type="number"
          step="any"
          className={`h-8 text-sm ${errors[name1] ? "border-destructive" : ""}`}
          {...register(name1, { required: true, valueAsNumber: true })}
        />
        <Input
          type="number"
          step="any"
          className={`h-8 text-sm ${errors[name2] ? "border-destructive" : ""}`}
          {...register(name2, { required: true, valueAsNumber: true })}
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

export default function ExamForm({ defaultDate, onSubmit, onCancel, isPending, error }: Props) {
  const now = new Date();
  const combinedDate = new Date(defaultDate);
  combinedDate.setHours(now.getHours(), now.getMinutes());

  const { register, handleSubmit, formState: { errors } } = useForm<ExamFormData>({
    defaultValues: {
      examinedAt: toDatetimeLocal(combinedDate),
      hospital: "",
      memo: "",
    },
  });

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">검사 일시</Label>
        <Input
          type="datetime-local"
          className="h-8 text-sm"
          {...register("examinedAt", { required: true })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">병원 (선택)</Label>
        <Input
          type="text"
          className="h-8 text-sm"
          placeholder="예: 서울병원"
          {...register("hospital")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">메모 (선택)</Label>
        <Input
          type="text"
          className="h-8 text-sm"
          placeholder="예: 피로감 있음"
          {...register("memo")}
        />
      </div>

      <Separator />

      <SectionTitle>Time Domain Analysis</SectionTitle>
      <NumberField label="MHR" name="mhr" register={register} errors={errors} />
      <NumberField label="SDNN" name="sdnn" register={register} errors={errors} />
      <NumberField label="RMSSD" name="rmssd" register={register} errors={errors} />
      <NumberField label="PSI" name="psi" register={register} errors={errors} />

      <Separator />

      <SectionTitle>Frequency Domain Analysis</SectionTitle>
      <DualNumberField label="TP" name1="tp" name2="tpLog" register={register} errors={errors} />
      <DualNumberField label="VLF" name1="vlf" name2="vlfLog" register={register} errors={errors} />
      <DualNumberField label="LF" name1="lf" name2="lfLog" register={register} errors={errors} />
      <DualNumberField label="HF" name1="hf" name2="hfLog" register={register} errors={errors} />
      <NumberField label="LFNorm" name="lfNorm" register={register} errors={errors} />
      <NumberField label="HFNorm" name="hfNorm" register={register} errors={errors} />
      <NumberField label="LF/HF Ratio" name="lfHfRatio" register={register} errors={errors} />
      <NumberField label="Ectopic Beat" name="ectopicBeat" register={register} errors={errors} />

      <Separator />

      <SectionTitle>Other</SectionTitle>
      <NumberField label="SRD" name="srd" register={register} errors={errors} />
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Result</Label>
        <Textarea
          rows={3}
          className={`text-sm resize-none ${errors.result ? "border-destructive" : ""}`}
          {...register("result", { required: true })}
        />
      </div>

      {hasErrors && (
        <p className="text-xs text-destructive">빈 칸을 모두 채워주세요.</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex gap-3 pt-2 pb-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
          취소
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
