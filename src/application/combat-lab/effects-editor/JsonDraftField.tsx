"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { effectAuthoringSchema } from "@/domain/combat-lab/effects/effectAuthoringSchema";
import { displayedText } from "@/common/translations";
import { Label } from "@/common/components/ui/label";

// Invalid drafts live in the form as invalid values too. A resolver must never
// be able to submit the previous valid effect while a different draft is shown.
const DRAFT_KEY = "__effectJsonDraft";
const DATA_DRAFT_PREFIX = "__invalidEffectJson:";

function draftText(value: unknown): string
{
  if (typeof value === "string" && value.startsWith(DATA_DRAFT_PREFIX)) return value.slice(DATA_DRAFT_PREFIX.length);
  if (value && typeof value === "object" && DRAFT_KEY in value) return String(value[DRAFT_KEY]);
  return JSON.stringify(value ?? {}, null, 2);
}

export function JsonDraftField({ name, pluginData = false }: { name: string; pluginData?: boolean })
{
  const { control, getValues } = useFormContext();
  // A plugin-key change must revalidate the visible data immediately.
  useWatch({ control, name: `${name}.effectType` });
  const fieldName = pluginData ? `${name}.data` : name;
  const id = useId();

  const validate = (value: unknown) => effectAuthoringSchema.safeParse(pluginData
    ? { type: "custom", effectType: getValues(`${name}.effectType`), data: value }
    : value);
  const { field } = useController({
    control, name: fieldName,
    rules: { validate: value => validate(value).success || displayedText.effectJsonShapeError },
  });
  const fingerprint = JSON.stringify(field.value);
  const lastWritten = useRef(fingerprint);
  const [raw, setRaw] = useState(() => draftText(field.value));

  useEffect(() =>
  {
    if (fingerprint === lastWritten.current) return;
    lastWritten.current = fingerprint;
    setRaw(draftText(field.value));
  }, [fingerprint, field.value]);

  function parse(text: string)
  {
    let json: unknown;
    try { json = JSON.parse(text); }
    catch { return { error: displayedText.effectJsonSyntaxError }; }

    const result = validate(json);
    if (!result.success)
    {
      const details = result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      return { error: `${displayedText.effectJsonShapeError} ${details}`, input: json };
    }

    return { value: pluginData && result.data.type === "custom" ? result.data.data : result.data };
  }

  const parsed = parse(raw);

  return (
    <div className="mt-3 flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {pluginData ? displayedText.effectPluginData : displayedText.effectJson}
      </Label>
      <textarea
        id={id}
        name={field.name}
        ref={field.ref}
        className="min-h-[120px] w-full rounded-md border bg-background p-2 font-mono text-xs"
        value={raw}
        aria-invalid={!!parsed.error}
        aria-describedby={parsed.error ? `${id}-error` : undefined}
        onBlur={field.onBlur}
        onChange={event =>
        {
          const text = event.target.value;
          setRaw(text);
          const result = parse(text);
          const invalid = pluginData ? DATA_DRAFT_PREFIX + text : { ...getValues(name), [DRAFT_KEY]: text };
          const value = result.error
            ? pluginData && "input" in result ? result.input : invalid
            : result.value;
          lastWritten.current = JSON.stringify(value);
          field.onChange(value);
        }}
      />
      {parsed.error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{parsed.error}</p>}
    </div>
  );
}
