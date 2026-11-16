"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import SelectOneOfStrings from "@/common/components/selects/SelectOneOfStrings";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/ui/button";
import { Form } from "@/ui/form";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/common/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/common/components/ui/alert-dialog";
import { deleteIcon, editIcon, leftIcon } from "@/common/icons";
import RequirementPicker from "@/application/common/requirements/RequirementPicker";
import requirementsManagementClient, { type ManagedStructuredRequirement } from "@/infrastructure/clients/requirementsManagementClient";
import type { RequirementEntityType } from "@/infrastructure/clients/requirementsClient";
import type { Requirement } from "@/domain/requirements/Requirement";
import { formatRequirement } from "@/domain/requirements/formatRequirement";
import { suggestRequirementMapping } from "@/domain/requirements/suggestRequirementMapping";
import { useAllEntityNames } from "@/common/hooks/useAllEntityNames";
import { Wand2 } from "lucide-react";

const ENTITY_ITEMS: { label: string; value: RequirementEntityType }[] = [
  { label: "Atuty", value: "perks" },
  { label: "Zaklecia", value: "spells" },
  { label: "Manewry", value: "maneuvers" },
  { label: "Postawy", value: "stances" },
  { label: "Stany", value: "states" },
];

/**
 * ROADMAP 7.9 — after the Wave 6.1 migration the panel holds ~1167 entries and
 * almost all of them are `rankless`, so scrolling for the handful of structured
 * ones is hopeless. `structured` means "anything that is not free text", which
 * keeps working when Wave 7 adds the `anyOf` and `sum` variants.
 */
type KindFilter = "all" | "rankless" | "structured";

const KIND_ITEMS: { label: string; value: KindFilter }[] = [
  { label: "Wszystkie", value: "all" },
  { label: "Bez rangi", value: "rankless" },
  { label: "Ustrukturyzowane", value: "structured" },
];

const KIND_FILTER_STORAGE_KEY = "admin-requirements-kind-filter";

function matchesKindFilter(requirement: Requirement, filter: KindFilter): boolean
{
  if (filter === "all") return true;
  return filter === "rankless" ? requirement.kind === "rankless" : requirement.kind !== "rankless";
}

function readStoredKindFilter(): KindFilter
{
  if (typeof window === "undefined") return "all";
  const stored = localStorage.getItem(KIND_FILTER_STORAGE_KEY);
  return stored === "rankless" || stored === "structured" || stored === "all" ? stored : "all";
}

function useInvalidate(entity: RequirementEntityType)
{
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({
    predicate: (query) => Array.isArray(query.queryKey)
      && query.queryKey.some((key) => typeof key === "string" && (key === "structuredRequirementsManagement" || key === "entityRequirements" || key === entity)),
  });
}

export default function StructuredRequirementsManager()
{
  const [entity, setEntity] = useState<RequirementEntityType>("perks");
  const [filterText, setFilterText] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>(readStoredKindFilter);
  const [editing, setEditing] = useState<Requirement | null>(null);
  const [deleting, setDeleting] = useState<ManagedStructuredRequirement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const invalidate = useInvalidate(entity);
  const entityNames = useAllEntityNames();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["structuredRequirementsManagement", entity],
    queryFn: () => requirementsManagementClient.getStructuredRequirements(entity),
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(() => {
    const labelled = data
      .filter((row) => matchesKindFilter(row.requirement, kindFilter))
      .map((row) => ({ ...row, label: formatRequirement(row.requirement) }));
    const filtered = filterText.trim()
      ? labelled.filter((row) => row.label.toLowerCase().includes(filterText.toLowerCase()))
      : labelled;
    return filtered.sort((left, right) => left.label.localeCompare(right.label));
  }, [data, filterText, kindFilter]);

  // Counted from the FULL set, never from `rows` — the point is to show how much
  // editorial work is left, which a filtered count would hide.
  const kindCounts = useMemo(() => ({
    all: data.length,
    rankless: data.filter((row) => row.requirement.kind === "rankless").length,
    structured: data.filter((row) => row.requirement.kind !== "rankless").length,
  }), [data]);

  const selectKindFilter = (value: KindFilter) =>
  {
    setKindFilter(value);
    if (typeof window !== "undefined") localStorage.setItem(KIND_FILTER_STORAGE_KEY, value);
    // The suggestions panel only ever looks at `rankless` entries, so leaving it
    // open under the "structured" filter would show an unexplained empty list.
    if (value === "structured") setShowSuggestions(false);
  };

  const deleteMutation = useMutation({
    mutationFn: () => requirementsManagementClient.deleteStructuredRequirement({ entity, requirement: deleting!.requirement }),
    onSuccess: async () => { await invalidate(); setDeleting(null); },
  });

  // Matcher suggestions for the current entity's rankless requirements.
  const suggestions = useMemo(() => {
    return data
      .filter((row) => row.requirement.kind === "rankless")
      .map((row) => {
        const original = row.requirement as Extract<Requirement, { kind: "rankless" }>;
        return { original, count: row.count, suggestion: suggestRequirementMapping(original.text, entityNames) };
      })
      .filter((row): row is { original: Extract<Requirement, { kind: "rankless" }>; count: number; suggestion: Extract<Requirement, { kind: "ranked" }> } =>
        row.suggestion !== null && !dismissed.has(row.original.text))
      .sort((left, right) => left.original.text.localeCompare(right.original.text));
  }, [data, entityNames, dismissed]);

  const approveMutation = useMutation({
    mutationFn: ({ original, replacement }: { original: Requirement; replacement: Requirement }) =>
      requirementsManagementClient.editStructuredRequirement({ entity, original, replacements: [replacement] }),
    onSuccess: async () => { await invalidate(); },
  });

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Zarzadzanie wymaganiami</h1>
          <p className="mt-2 text-muted-foreground">Wymagania strukturalne: edytuj (picker) lub usun zbiorczo we wszystkich rekordach danego typu.</p>
        </div>
        <Button asChild variant="outline" size="icon">
          <Link href="/admin" aria-label="Wroc do panelu admina">{leftIcon}</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SelectOneOfStrings
          id="structured-requirement-entity-select"
          value={entity}
          items={ENTITY_ITEMS}
          onChange={(value) => { setEntity(value as RequirementEntityType); setFilterText(""); }}
          triggerClassName="h-11 w-36 border bg-background px-3 py-2 text-sm shadow-sm md:w-36"
        />
        <Input
          placeholder="Filtruj..."
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
          className="h-9 w-70 border bg-background px-3 py-2 text-sm shadow-sm md:w-56"
        />
        <div className="flex flex-wrap items-center gap-1 rounded-md border bg-background p-1" role="group" aria-label="Rodzaj wymagania">
          {
            KIND_ITEMS.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={kindFilter === item.value ? "default" : "ghost"}
                aria-pressed={kindFilter === item.value}
                onClick={() => selectKindFilter(item.value)}
              >
                {item.label}
                <span className="ml-1.5 text-xs opacity-70">({kindCounts[item.value]})</span>
              </Button>
            ))
          }
        </div>

        {
          kindFilter !== "structured" && (
            <Button
              type="button"
              variant={showSuggestions ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowSuggestions((value) => !value)}
            >
              <Wand2 className="h-4 w-4" />
              Sugestie mapowania{suggestions.length > 0 ? ` (${suggestions.length})` : ""}
            </Button>
          )
        }
      </div>

      {showSuggestions && (
        <div className="rounded-lg border overflow-hidden">
          <div className="border-b bg-muted/40 px-4 py-3 text-sm font-medium">
            Propozycje matchera: tekst → struktura (zatwierdź, by zamienić we wszystkich rekordach)
          </div>
          {
            suggestions.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Brak sugestii dla wymagań tekstowych tego typu.</div>
            ) : (
              suggestions.map(({ original, count, suggestion }) => (
                <div key={original.text} className="flex flex-col gap-3 border-t px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <span className="break-all">„{original.text}&quot;</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium text-primary">{formatRequirement(suggestion)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({count})</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate({ original, replacement: suggestion })}
                    >
                      Zatwierdź
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDismissed((prev) => new Set(prev).add(original.text))}
                    >
                      Odrzuć
                    </Button>
                  </div>
                </div>
              ))
            )
          }
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center md:gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
          <span>Wymaganie</span>
          <span className="text-center">Liczba uzyc</span>
          <span>Akcje</span>
        </div>

        {
          isLoading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Ladowanie wymagan...</div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-destructive">Nie udalo sie pobrac listy wymagan.</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Brak wymagan strukturalnych dla wybranego typu.</div>
          ) : (
            rows.map((row) => (
              <div key={row.label} className="grid gap-3 border-t px-4 py-4 text-sm md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center md:gap-4 md:py-3">
                <div className="min-w-0">
                  <div className={row.requirement.kind === "ranked" ? "font-medium text-primary break-all" : "font-medium break-all"}>{row.label}</div>
                </div>
                <div className="flex items-center justify-between gap-3 md:block md:text-center">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">Liczba uzyc</span>
                  <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-muted px-2.5 py-1 font-medium">{row.count}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-start">
                  <Button type="button" variant="outline" size="icon" className="w-full sm:w-9" aria-label="Edytuj" title="Edytuj (picker)" onClick={() => setEditing(row.requirement)}>
                    {editIcon}
                  </Button>
                  <Button type="button" variant="destructive" size="icon" className="w-full sm:w-9" aria-label="Usun" title="Usun" onClick={() => setDeleting(row)}>
                    {deleteIcon}
                  </Button>
                </div>
              </div>
            ))
          )
        }
      </div>

      <Sheet open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {/* Wide enough for the alternative editor: each option row carries two
            selects, a number and a remove button, which overflowed max-w-md. */}
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {editing && <EditForm key={`${entity}:${formatRequirement(editing)}`} entity={entity} original={editing} onClose={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdzenie operacji</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && `Wymaganie „${formatRequirement(deleting.requirement)}" zostanie usuniete z ${deleting.count} rekordow.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction disabled={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); deleteMutation.mutate(); }}>
              Potwierdz usuniecie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Editing one stored requirement — which may turn it into SEVERAL.
 *
 * The stored array is already a conjunction, so a compound legacy text like
 * "Ilość postaw i manewrów fizycznych 3" is best expressed as two independent
 * entries. Rather than inventing an `allOf` variant that would duplicate what
 * the array already means, the form edits a list and the endpoint swaps the
 * original for all of them at once.
 */
function EditForm({ entity, original, onClose }: { entity: RequirementEntityType; original: Requirement; onClose: () => void })
{
  const invalidate = useInvalidate(entity);
  const form = useForm<{ requirements: Requirement[] }>({ defaultValues: { requirements: [original] } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "requirements" as never });

  /**
   * "Dodaj kolejne wymaganie" seeds an empty free-text row. Leaving it blank and
   * saving used to fail validation server-side with nothing on screen to explain
   * it, so a row the editor never filled in is simply dropped.
   */
  const submittedRequirements = (): Requirement[] =>
    form.getValues("requirements").filter((requirement) => requirement.kind !== "rankless" || requirement.text.trim() !== "");

  const mutation = useMutation({
    mutationFn: () => {
      const replacements = submittedRequirements();
      if (replacements.length === 0)
      {
        // Replacing a requirement with nothing is what the delete action is for.
        throw new Error("Uzupelnij przynajmniej jedno wymaganie albo uzyj usuwania.");
      }

      return requirementsManagementClient.editStructuredRequirement({ entity, original, replacements });
    },
    onSuccess: async () => { await invalidate(); onClose(); },
  });

  // Without this the save could fail (a rejected payload, a network error) and
  // the sheet just sat there doing nothing, with no way to tell what happened.
  const error = mutation.error
    ? (mutation.error as { response?: { data?: { message?: string } }; message?: string })
    : undefined;
  const errorMessage = error?.response?.data?.message ?? error?.message;

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edytuj wymaganie strukturalne</SheetTitle>
        <SheetDescription>
          „{formatRequirement(original)}&quot; zostanie zmienione we wszystkich rekordach, ktore je maja.
          Dodanie kolejnej pozycji rozbije je na osobne wymagania — wszystkie musza byc spelnione.
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        {/* The footer sits OUTSIDE the scrolling area: with two alternative
            options the form grew past the viewport and „Zapisz" ended up
            unreachable below the fold. */}
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
            {fields.map((field, index) => (
              <RequirementPicker
                key={field.id}
                name={`requirements.${index}`}
                // The last remaining entry cannot be removed: replacing a
                // requirement with nothing is what the delete action is for.
                onRemove={fields.length > 1 ? () => remove(index) : undefined}
              />
            ))}

            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => append({ kind: "rankless", text: "" } as never)}>
              Dodaj kolejne wymaganie (i)
            </Button>
          </div>

          {errorMessage && (
            <p className="px-4 pt-2 text-sm text-destructive">Nie udalo sie zapisac: {errorMessage}</p>
          )}

          <SheetFooter className="border-t px-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Zapisywanie…" : "Zapisz"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
          </SheetFooter>
        </form>
      </Form>
    </>
  );
}
