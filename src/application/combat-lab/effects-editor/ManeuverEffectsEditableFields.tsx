"use client";

/**
 * In-app editor for a maneuver's `effects` (+ simulatable / unsupportedReason),
 * embedded in the compendium maneuver edit sheet. Writes straight to the form
 * (react-hook-form), so the existing submit → API → Prisma path persists it —
 * no CSV/import. The effect list itself (incl. recursion for when/chance) lives
 * in `EffectListField`; this component adds the maneuver-level controls +
 * live description preview.
 */

import { useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { toManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";
import { EffectListField } from "@/application/combat-lab/effects-editor/EffectListField";
import { asEffects, type LooseEffect } from "@/application/combat-lab/effects-editor/effectFieldsMeta";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

export function ManeuverEffectsEditableFields()
{
  const { control, getValues, setValue } = useFormContext();
  const watchedEffects = useWatch({ control, name: "effects" }) as LooseEffect[] | undefined;
  const simulatable = useWatch({ control, name: "simulatable" }) as boolean | null | undefined;

  const preview = useMemo(() =>
  {
    try
    {
      const v = getValues();
      const def = toManeuverDefinition({
        id: v.id ?? "x", name: v.name ?? "", grade: v.grade ?? 1, description: v.description ?? "",
        price: v.price ?? 0, tags: v.tags ?? [],
        castTime: v.castTime ?? "Standardowa", cooldown: v.cooldown ?? undefined,
        effects: asEffects((watchedEffects ?? []) as LooseEffect[]),
        simulatable: v.simulatable ?? undefined, unsupportedReason: v.unsupportedReason ?? undefined,
      });
      return describeManeuver(def);
    }
    catch { return "—"; }
  }, [watchedEffects, getValues]);

  return (
    <div className="grid gap-4 px-4">
      <Label className="text-base">Efekty</Label>

      <EffectListField name="effects" />

      <div className="flex flex-wrap items-end gap-3 border-t pt-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status symulacji</Label>
          <Select
            value={simulatable === true ? "true" : simulatable === false ? "false" : "unknown"}
            onValueChange={(v) => setValue("simulatable", v === "true" ? true : v === "false" ? false : null, { shouldDirty: true })}
          >
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
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
                <Label className="text-xs text-muted-foreground">Powód (niesymulowalny)</Label>
                <Input {...field} value={field.value ?? ""} placeholder="np. skaluje się esencją — brak modelu zasobów" />
              </div>
            )}
          />
        )}
      </div>

      <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
        <div className="text-xs text-muted-foreground">Podgląd opisu (z efektów):</div>
        <div>{preview}</div>
      </div>
    </div>
  );
}
