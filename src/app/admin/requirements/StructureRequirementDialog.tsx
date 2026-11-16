"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form } from "@/ui/form";
import { Button } from "@/common/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/common/components/ui/sheet";
import RequirementPicker from "@/application/common/requirements/RequirementPicker";
import requirementsManagementClient from "@/infrastructure/clients/requirementsManagementClient";
import type { RequirementEntityType } from "@/infrastructure/clients/requirementsClient";
import type { Requirement } from "@/domain/requirements/Requirement";
import { suggestRequirementMapping } from "@/domain/requirements/suggestRequirementMapping";
import { normalizeRequirementText } from "@/domain/requirements/normalizeRequirementText";

export type StructuringRow = { value: string; count: number };

type StructureRequirementDialogProps = {
  entity: RequirementEntityType;
  row: StructuringRow | null;
  onClose: () => void;
};

export default function StructureRequirementDialog({ entity, row, onClose }: StructureRequirementDialogProps)
{
  return (
    <Sheet open={Boolean(row)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md">
        {row && <StructureForm key={`${entity}:${row.value}`} entity={entity} requirementText={row.value} count={row.count} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function StructureForm({ entity, requirementText, count, onClose }: { entity: RequirementEntityType; requirementText: string; count: number; onClose: () => void })
{
  const queryClient = useQueryClient();

  // Pre-fill with the matcher's best guess; fall back to a normalized rankless.
  const initial = useMemo<Requirement>(
    () => suggestRequirementMapping(requirementText) ?? { kind: "rankless", text: normalizeRequirementText(requirementText) },
    [requirementText],
  );

  const form = useForm<{ requirement: Requirement }>({ defaultValues: { requirement: initial } });

  const mutation = useMutation({
    mutationFn: () => requirementsManagementClient.structureRequirement({
      entity,
      requirementText,
      requirement: form.getValues("requirement"),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey)
          && query.queryKey.some((key) => typeof key === "string" && (key === "requirementsManagement" || key === "entityRequirements" || key === entity)),
      });
      onClose();
    },
  });

  return (
    <>
      <SheetHeader>
        <SheetTitle>Strukturyzuj wymaganie</SheetTitle>
        <SheetDescription>
          „{requirementText}&quot; zostanie zastąpione strukturą w {count} {count === 1 ? "rekordzie" : "rekordach"}.
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}
        >
          <RequirementPicker name="requirement" />

          <SheetFooter className="px-0 pb-0">
            <Button type="submit" disabled={mutation.isPending}>Zastosuj</Button>
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
          </SheetFooter>
        </form>
      </Form>
    </>
  );
}
