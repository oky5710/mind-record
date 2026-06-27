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
  // Frequency Domain Analysis (log값은 자동 계산)
  tp: number;
  vlf: number;
  lf: number;
  hf: number;
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

function computeLog(v: number): string {
  return Number.isFinite(v) && v > 0 ? Math.log(v).toFixed(2) : "—";
}

function NumberField({ label, name, register, errors }: {
  label: string;
  name: keyof ExamFormData;
  register: ReturnType<typeof useForm<ExamFormData>>["register"];
  errors: FieldErrors<ExamFormData>;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step="any"
        className={`h-8 text-sm ${errors[name] ? "border-destructive" : ""}`}
        {...register(name, { required: true, valueAsNumber: true })}
      />
    </div>
  );
}

function LogNumberField({ label, name, register, errors, currentValue }: {
  label: string;
  name: keyof ExamFormData;
  register: ReturnType<typeof useForm<ExamFormData>>["register"];
  errors: FieldErrors<ExamFormData>;
  currentValue: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2 flex-1">
        <Input
          type="number"
          step="any"
          className={`h-8 text-sm ${errors[name] ? "border-destructive" : ""}`}
          {...register(name, { required: true, valueAsNumber: true })}
        />
        <div className="h-8 flex items-center justify-end px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground w-24 shrink-0 tabular-nums">
          {computeLog(currentValue)}
        </div>
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExamFormData>({
    defaultValues: {
      examinedAt: toDatetimeLocal(combinedDate),
      hospital: "",
      memo: "",
    },
  });

  const [tp, vlf, lf, hf] = watch(["tp", "vlf", "lf", "hf"]);
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
      <LogNumberField label="TP" name="tp" register={register} errors={errors} currentValue={tp} />
      <LogNumberField label="VLF" name="vlf" register={register} errors={errors} currentValue={vlf} />
      <LogNumberField label="LF" name="lf" register={register} errors={errors} currentValue={lf} />
      <LogNumberField label="HF" name="hf" register={register} errors={errors} currentValue={hf} />
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
