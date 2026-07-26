"use client";

/**
 * List editor for `structuredRequirements` (Wave 5, 5.3). Mirrors
 * `EffectListField`: a `useFieldArray` over the requirements at `name`, each row
 * rendered by `RequirementPicker`, with add / remove controls. Wired into the
 * compendium editors ALONGSIDE the legacy free-text `requirements` field until
 * the migration (5.4) retires it.
 */

import { useFieldArray, useFormContext } from "react-hook-form";
import { Label } from "@/common/components/ui/label";
import { Button } from "@/common/components/ui/button";
import RequirementPicker from "@/application/common/requirements/RequirementPicker";
import type { Requirement } from "@/domain/requirements/Requirement";

const NEW_REQUIREMENT: Requirement = { kind: "rankless", text: "" };

export default function RequirementListField({ name = "structuredRequirements" }: { name?: string })
{
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="grid auto-rows-min gap-3 px-4">
      <Label className="justify-center"><span className="first-letter:uppercase">Wymagania (strukturalne)</span></Label>

      <div className="flex flex-col gap-2">
        {fields.length === 0 && <p className="text-center text-sm text-muted-foreground">Brak wymagań strukturalnych.</p>}

        {fields.map((f, i) => (
          <RequirementPicker key={f.id} name={`${name}.${i}`} onRemove={() => remove(i)} />
        ))}

        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={() => append(NEW_REQUIREMENT)}>+ Dodaj wymaganie</Button>
        </div>
      </div>
    </div>
  );
}
