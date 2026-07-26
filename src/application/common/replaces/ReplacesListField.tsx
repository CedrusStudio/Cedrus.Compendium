"use client";

/**
 * List editor for `replaces` (ROADMAP 8.9).
 *
 * A replacement is a relation between two entities of the SAME kind — a maneuver
 * supersedes another maneuver — so the group is imposed by the editor, not
 * chosen per row, and the target is picked by name from the library instead of
 * typed. Rank is deliberately absent: „Młyniec 1" and „Młyniec 3" are one entity
 * as far as replacing goes, and `/api/entity-names` already groups by name.
 *
 * Deliberately NOT built on `useFieldArray`: the value is an array of plain
 * strings, and react-hook-form's field array is designed for objects (its
 * `fields` carry no primitive value). Watching the array and writing it back
 * with `setValue` is shorter and behaves predictably.
 *
 * Empty rows are dropped at save time by `perkSchema` — the same trap that broke
 * the admin sheet in 8.7, where a seeded blank entry silently failed validation.
 */

import { useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/common/components/ui/label";
import { Button } from "@/common/components/ui/button";
import EntityNameCombobox from "@/application/common/requirements/EntityNameCombobox";
import type { RequirementEntityType } from "@/common/hooks/useEntityRequirements";

type ReplacesListFieldProps =
{
  /** Compendium group whose names are suggested — always the edited entity's own kind. */
  group: RequirementEntityType;
  /** Form path of the array. */
  name?: string;
  /** Form path of the edited entity's name, so it can't replace itself. */
  namePath?: string;
};

export default function ReplacesListField({ group, name = "replaces", namePath = "name" }: ReplacesListFieldProps)
{
  const { control, setValue } = useFormContext();

  const replaces = (useWatch({ control, name }) ?? []) as string[];
  const ownName = (useWatch({ control, name: namePath }) ?? "") as string;

  const write = (next: string[]) => setValue(name, next, { shouldDirty: true, shouldValidate: true });

  const change = (index: number, value: string) => write(replaces.map((entry, i) => (i === index ? value : entry)));
  const remove = (index: number) => write(replaces.filter((_, i) => i !== index));
  const add = () => write([...replaces, ""]);

  return (
    <div className="grid auto-rows-min gap-3 px-4">
      <Label className="justify-center"><span className="first-letter:uppercase">Zastępuje</span></Label>

      <div className="flex flex-col gap-2">
        {replaces.length === 0 && <p className="text-center text-sm text-muted-foreground">Nic nie zastępuje.</p>}

        {replaces.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <EntityNameCombobox
              group={group}
              value={entry ?? ""}
              onChange={(value) => change(index, value)}
              placeholder="wybierz encję"
              unknownWarning
              excludeNames={ownName ? [ownName] : undefined}
            />

            <Button type="button" variant="ghost" size="sm" aria-label="Usuń zastąpienie" onClick={() => remove(index)}>✕</Button>
          </div>
        ))}

        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={add}>+ Dodaj zastąpienie</Button>
        </div>
      </div>
    </div>
  );
}
