"use client";

import { useId } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { Input } from "@/ui/input";
import { parseRequiredNumberInput } from "@/common/global/numericInput";

export default function RequirementNumberInput({ name, value, onChange, className }: {
  name: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
})
{
  const { control, getFieldState, trigger } = useFormContext();
  const state = useFormState({ control, name });
  const { error } = getFieldState(name, state);
  const errorId = useId();
  return <div className="flex flex-col gap-1">
    <Input type="number" name={name} value={value} className={className}
      aria-invalid={Boolean(error)} aria-required="true" aria-describedby={error ? errorId : undefined}
      onChange={event => onChange(parseRequiredNumberInput(event.target.value))}
      onBlur={() => { void trigger(name); }} />
    {error?.message && <p id={errorId} role="alert" className="text-sm text-destructive">{error.message}</p>}
  </div>;
}
