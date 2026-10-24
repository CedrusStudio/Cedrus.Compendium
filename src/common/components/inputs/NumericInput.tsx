"use client";

import { useState, type ComponentProps } from "react";
import { normalizeNumericInput } from "@/common/global/numericInput";

type InputValue = ComponentProps<"input">["value"];
type EmptyDraft = { value: InputValue; name?: string; pending: boolean };

/** Numeric input behavior, without styles, for both shared and compact editors. */
export function NumericInput({ value, name, onChange, onBlur, ...props }: ComponentProps<"input">)
{
  const [emptyDraft, setEmptyDraft] = useState<EmptyDraft | null>(null);
  const isEmptyDraft = emptyDraft !== null && emptyDraft.name === name &&
    (emptyDraft.pending || Object.is(emptyDraft.value, value));

  if (emptyDraft !== null)
  {
    if (!isEmptyDraft) setEmptyDraft(null);
    // Observe the parent's result of this edit (0, a minimum, or an empty value).
    // Later external updates must replace the draft, even while still focused.
    else if (emptyDraft.pending) setEmptyDraft({ value, name, pending: false });
  }

  return (
    <input
      {...props}
      name={name}
      value={isEmptyDraft || (typeof value === "number" && Number.isNaN(value)) ? "" : value}
      onChange={event => {
        normalizeNumericInput(event.currentTarget);
        setEmptyDraft(event.currentTarget.value === "" && value !== undefined
          ? { value, name, pending: true }
          : null);
        onChange?.(event);
      }}
      onBlur={event => {
        // Preserve the existing numeric fallback and let validation see it.
        if (isEmptyDraft) event.currentTarget.value = value == null || (typeof value === "number" && Number.isNaN(value)) ? "" : String(value);
        setEmptyDraft(null);
        onBlur?.(event);
      }}
    />
  );
}
