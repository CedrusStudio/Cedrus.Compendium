"use client";

/**
 * In-app editor for a maneuver's `effects` (+ simulatable / unsupportedReason),
 * embedded in the compendium maneuver edit sheet. Writes straight to the form
 * (react-hook-form), so the existing submit → API → Prisma path persists it —
 * no CSV/import. The effect list itself (incl. recursion for when/chance) lives
 * in `EffectListField`; this component adds the maneuver-level controls +
 * live description preview.
 */

import { useId } from "react";
import { effectsAuthoringSchema } from "@/domain/combat-lab/effects/effectAuthoringSchema";
import { displayedText } from "@/common/translations";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { toManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";
import { EffectListField } from "@/application/combat-lab/effects-editor/EffectListField";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

export function ManeuverEffectsEditableFields()
{
  const { control, setValue } = useFormContext();
  const values = useWatch({ control });
  const { effects, simulatable } = values;
  const id = useId();

  function descriptionPreview(): string
  {
    const parsed = effectsAuthoringSchema.safeParse(effects ?? []);
    if (!parsed.success) return displayedText.effectPreviewInvalid;
    if (simulatable === false) return displayedText.effectPreviewUnsupported;
    if (parsed.data.length === 0) return displayedText.effectPreviewEmpty;

    try
    {
      const def = toManeuverDefinition({
        id: values.id ?? "x", name: values.name ?? "", grade: values.grade ?? 1, description: values.description ?? "",
        price: values.price ?? 0, tags: values.tags ?? [],
        castTime: values.castTime ?? "Standardowa", cooldown: values.cooldown ?? undefined,
        effects: parsed.data,
        simulatable: simulatable ?? undefined, unsupportedReason: values.unsupportedReason ?? undefined,
      });
      return describeManeuver(def);
    }
    catch { return displayedText.effectPreviewInvalid; }
  }

  return (
    <div className="grid gap-4 px-4">
      <Label className="text-base">Efekty</Label>

      <EffectListField key={values.id ?? "new"} name="effects" />

      <div className="flex flex-wrap items-end gap-3 border-t pt-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-status`} className="text-xs text-muted-foreground">Status symulacji</Label>
          <Select
            value={simulatable === true ? "true" : simulatable === false ? "false" : "unknown"}
            onValueChange={(v) => setValue("simulatable", v === "true" ? true : v === "false" ? false : null, { shouldDirty: true })}
          >
            <SelectTrigger id={`${id}-status`} className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">nieoceniony</SelectItem>
              <SelectItem value="true">symulowalny</SelectItem>
              <SelectItem value="false">niesymulowalny</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {simulatable === false && (
          <Controller
            control={control}
            name="unsupportedReason"
            render={({ field }) => (
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor={`${id}-reason`} className="text-xs text-muted-foreground">Powód (niesymulowalny)</Label>
                <Input {...field} id={`${id}-reason`} value={field.value ?? ""} placeholder="np. skaluje się esencją — brak modelu zasobów" />
              </div>
            )}
          />
        )}
      </div>

      <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
        <div className="text-xs text-muted-foreground">Podgląd opisu (z efektów):</div>
        <div role="status" aria-live="polite">{descriptionPreview()}</div>
      </div>
    </div>
  );
}
