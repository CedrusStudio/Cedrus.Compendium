"use client";

import { NumericInput } from "@/common/components/inputs/NumericInput";
import { parseRequiredNumberInput } from "@/common/global/numericInput";

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/ui/sheet';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { Textarea } from '@/ui/textarea';
import CharacterPickerGrid from '@/application/characters/components/CharacterPickerGrid';
import type { CharacterSummary } from '@/infrastructure/searchQueries/characters/createCharacterSummaryQuery';
import type { AiCharacterDraft } from '@/domain/ai-character-generation/aiCharacterDraft';
import { aiCharacterProposalSchema, type AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import type { BalanceComparison } from '@/domain/ai-character-generation/compareToBalanceProfile';
import type { AiCatalogSearchResult } from '@/domain/ai-character-generation/toAiCharacterCatalog';
import aiCharacterDraftsClient from '@/infrastructure/clients/aiCharacterDraftsClient';
import tagsClient from '@/infrastructure/clients/tagsClient';
import { displayedText } from '@/common/translations';
import { toCriticalRangeString, toOffenseString } from '@/domain/characters/combat/Offense';

const MAX_REFERENCES = 3;
const MIN_DESCRIPTION_LENGTH = 10;

function getGenerationErrorMessage(error: unknown): string
{
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string') {
      return (data as { error: string }).error;
    }
  }

  return 'Nie udało się utworzyć wersji roboczej. Spróbuj ponownie później.';
}

function formatCost(microUsd: number): string
{
  return (microUsd / 1_000_000).toLocaleString('pl-PL', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  });
}

type ReferencePickerProps = {
  references: CharacterSummary[];
  onAdd: (summary: CharacterSummary) => void;
  onRemove: (id: string) => void;
};

function ReferencePicker({ references, onAdd, onRemove }: ReferencePickerProps)
{
  const [open, setOpen] = useState(false);
  const selectedIds = useMemo(() => new Set(references.map(reference => reference.id)), [references]);

  const handleSelect = useCallback((id: string, summary?: CharacterSummary) =>
  {
    if (!summary || selectedIds.has(id) || references.length >= MAX_REFERENCES) return;
    onAdd(summary);
    setOpen(false);
  }, [onAdd, references.length, selectedIds]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Postaci referencyjne</p>
          <p className="text-sm text-muted-foreground">Opcjonalnie wybierz do trzech widocznych postaci jako wzorce.</p>
        </div>
        <span className="text-sm text-muted-foreground">{references.length}/{MAX_REFERENCES}</span>
      </div>

      {references.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {references.map(reference => (
            <Button
              key={reference.id}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onRemove(reference.id)}
            >
              {reference.name} ×
            </Button>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" disabled={references.length >= MAX_REFERENCES}>
            Dodaj postać referencyjną
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Wybierz postać referencyjną</SheetTitle>
            <SheetDescription>Model dostanie wyłącznie postaci, do których masz dostęp w aplikacji.</SheetDescription>
          </SheetHeader>
          <div className="mt-5">
            <CharacterPickerGrid
              onSelectCharacter={() => undefined}
              onSelectCharacterSummary={summary => handleSelect(summary.id, summary)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

type StatisticValue = { grade: number; value: number; bonus: number; testBonus: number };

/** Every number a statistic holds, in the order the character sheet reads them. */
const STATISTIC_FIELDS: readonly { field: keyof StatisticValue; label: string }[] = [
  { field: 'grade', label: 'ranga' },
  { field: 'value', label: 'wartość' },
  { field: 'bonus', label: 'bonus' },
  { field: 'testBonus', label: 'test' },
];

/**
 * All four numbers are editable, not just the value.
 *
 * The rank is the die a test is rolled on and the bonuses are the manual
 * adjustments — a reviewer correcting a statistic usually has to touch more
 * than one of them, and sending them back to the full editor for the other
 * three made the panel a half-measure.
 */
function StatisticGrid({ values, onChange }: {
  values: Record<string, StatisticValue>;
  onChange?: (key: string, field: keyof StatisticValue, value: number) => void;
})
{
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(values).map(([name, statistic]) => {
        // The DTO keys are English; the sheet shows the same labels as the editor.
        const label = displayedText[name as keyof typeof displayedText] ?? name;

        return (
          <div key={name} className="rounded-md border px-3 py-2 text-sm">
            <p className="font-medium capitalize">{label}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
              {STATISTIC_FIELDS.map(({ field, label: fieldLabel }) => (
                <span key={field} className="inline-flex items-center gap-1">
                  {fieldLabel}
                  {onChange
                    ? (
                      <NumericInput
                        type="number"
                        aria-label={`${fieldLabel}: ${label}`}
                        className="w-14 rounded border bg-transparent px-1 py-0.5"
                        value={statistic[field]}
                        onChange={event => onChange(name, field, parseRequiredNumberInput(event.target.value))}
                      />
                    )
                    : <span className="text-foreground">{statistic[field]}</span>}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Tags are the character's own words, not compendium records, so they are the
 * one list a reviewer can both extend and trim without touching the catalog.
 * They also decide which balance profiles the draft is measured against, which
 * is why correcting them is worth a control of its own.
 */
/**
 * Tags that say which game a character belongs to rather than what it is.
 *
 * The compendium already carries `sesja-saofie` and `sesja-elonowa`, and there
 * will be one per game, so they are listed apart: a session tag is the
 * reviewer's own bookkeeping and never describes the character's kind. It also
 * never reaches a balance profile — those need eight characters sharing a tag,
 * and a session has one or two.
 */
const SESSION_TAG_PREFIX = 'sesja-';

function TagEditor({ tags, onChange }: { tags: readonly string[]; onChange: (tags: string[]) => void })
{
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Reaching for a tag that already exists is the common case; a typo in one is
  // invisible until the balance comparison silently finds no profile to measure
  // the character against.
  const existingTags = useQuery({
    queryKey: ['character-tags'],
    queryFn: async () => tagsClient.getEntityTags('characters'),
    staleTime: 5 * 60 * 1000,
  });

  const query = search.trim().toLocaleLowerCase('pl-PL');
  const available = (existingTags.data ?? [])
    .filter(tag => !tags.includes(tag))
    .filter(tag => query.length === 0 || tag.toLocaleLowerCase('pl-PL').includes(query));

  const sessions = available.filter(tag => tag.startsWith(SESSION_TAG_PREFIX));
  const kinds = available.filter(tag => !tag.startsWith(SESSION_TAG_PREFIX));
  const isNew = query.length > 0 && !(existingTags.data ?? []).some(tag => tag.toLocaleLowerCase('pl-PL') === query);

  const add = (candidate: string) => {
    const value = candidate.trim().toLocaleLowerCase('pl-PL');
    if (value.length > 0 && !tags.includes(value)) onChange([...tags, value]);

    setSearch('');
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Tagi:</span>
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 rounded border px-2 py-0.5">
          {tag}
          <button
            type="button"
            aria-label={`Usuń tag ${tag}`}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onChange(tags.filter(other => other !== tag))}
          >
            ×
          </button>
        </span>
      ))}

      <Popover open={open} onOpenChange={next => { setOpen(next); if (!next) setSearch(''); }}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" role="combobox" aria-label="Dodaj tag" aria-expanded={open}>
            Dodaj tag
            <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Szukaj tagu…" value={search} onValueChange={setSearch} />
            <CommandList>
              {existingTags.isPending && <div className="px-3 py-2 text-sm text-muted-foreground">Ładowanie…</div>}
              {!existingTags.isPending && available.length === 0 && !isNew && <CommandEmpty>Brak tagów.</CommandEmpty>}

              {kinds.length > 0 && (
                <CommandGroup heading="Rodzaj postaci">
                  {kinds.map(tag => (
                    <CommandItem key={tag} value={tag} onSelect={() => add(tag)}>{tag}</CommandItem>
                  ))}
                </CommandGroup>
              )}

              {sessions.length > 0 && (
                <CommandGroup heading="Sesje">
                  {sessions.map(tag => (
                    <CommandItem key={tag} value={tag} onSelect={() => add(tag)}>{tag}</CommandItem>
                  ))}
                </CommandGroup>
              )}

              {isNew && (
                <CommandGroup heading="Nowy">
                  <CommandItem value={`__new__:${search}`} onSelect={() => add(search)}>
                    Użyj: „{search.trim().toLocaleLowerCase('pl-PL')}&quot;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Searches one kind of compendium record and hands back the picked one.
 *
 * Searching rather than browsing is what the reviewer's two jobs both need: to
 * add „Odwet" you type its name, and to raise „Większy Fortel" from 3 to 4 you
 * type the same name and take the next rank — the compendium keeps each rank as
 * its own record, so raising a rank is picking a different one.
 */
function CatalogPicker({ kind, title, initialQuery, onPick, onClose }: {
  kind: string;
  title: string;
  initialQuery: string;
  onPick: (result: AiCatalogSearchResult) => void;
  onClose: () => void;
})
{
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery);

  const results = useQuery({
    queryKey: ['ai-character-catalog', kind, submitted],
    queryFn: async () => aiCharacterDraftsClient.catalog(kind, submitted),
  });

  return (
    <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Wpisy pochodzą z kompendium. Każda ranga to osobny wpis — żeby podnieść rangę, wybierz ten sam
            wpis o wyższej randze.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="flex gap-2">
            <input
              autoFocus
              aria-label="Szukaj w kompendium"
              className="w-full rounded border bg-transparent px-3 py-2"
              value={query}
              placeholder="Nazwa wpisu"
              onChange={event => setQuery(event.target.value)}
              onKeyDown={event => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                setSubmitted(query);
              }}
            />
            <Button type="button" onClick={() => setSubmitted(query)}>Szukaj</Button>
          </div>

          {results.isPending && <p className="text-sm text-muted-foreground">Szukanie…</p>}
          {results.isError && <p className="text-sm text-destructive">Nie udało się przeszukać kompendium.</p>}
          {results.data?.length === 0 && <p className="text-sm text-muted-foreground">Nic nie pasuje do tej nazwy.</p>}

          <div className="space-y-2">
            {results.data?.map(result => (
              <button
                key={result.id}
                type="button"
                className="w-full rounded-md border px-3 py-2 text-left hover:border-primary"
                onClick={() => onPick(result)}
              >
                <p className="font-medium">
                  {result.grade === undefined ? result.name : `${result.name} (${result.grade})`}
                  {result.price !== undefined && <span className="ml-2 font-normal text-muted-foreground">koszt {result.price}</span>}
                </p>
                {result.requirements && result.requirements.length > 0 && (
                  <p className="text-sm text-muted-foreground">Wymagania: {result.requirements.join('; ')}</p>
                )}
                {result.description && <p className="text-sm text-muted-foreground">{result.description}</p>}
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The race is one identifier rather than a list, so it gets its own control.
 *
 * It matters more than its size suggests: a race carries the characteristic
 * modifiers, and the model's habit when the description says nothing is to
 * reach for the ordinary human — right often enough to be worth changing in
 * place rather than after the draft is accepted.
 */
function RaceEditor({ raceId, onPick, onClear }: {
  raceId: string | null | undefined;
  onPick: (result: AiCatalogSearchResult) => void;
  onClear: () => void;
})
{
  const [picking, setPicking] = useState(false);

  // The proposal stores only the identifier, so the name has to be looked up.
  // Races are a small kind and a blank query returns all of them.
  const races = useQuery({
    queryKey: ['ai-character-catalog', 'race', ''],
    queryFn: async () => aiCharacterDraftsClient.catalog('race', ''),
    staleTime: 5 * 60 * 1000,
  });
  const raceName = races.data?.find(race => race.id === raceId)?.name;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Rasa:</span>
      {raceId
        ? (
          <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5">
            {raceName ?? (races.isPending ? '…' : raceId)}
            <button
              type="button"
              aria-label="Usuń rasę"
              className="text-muted-foreground hover:text-destructive"
              onClick={onClear}
            >
              ×
            </button>
          </span>
        )
        : <span className="text-muted-foreground">brak</span>}
      <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
        {raceId ? 'Zmień rasę' : 'Wybierz rasę'}
      </Button>

      {picking && (
        <CatalogPicker
          kind="race"
          title="Wybierz rasę"
          initialQuery=""
          onClose={() => setPicking(false)}
          onPick={result => {
            onPick(result);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

type NamedEntry = { id: string; name: string; grade?: number };

/**
 * Removal is inline rather than behind an edit mode: trimming what the model
 * over-picked is the common case, and a mode switch would put a click in front
 * of every one of them. The name itself is the swap control, because the thing
 * a reviewer most often wants is not this entry but its neighbour one rank up.
 */
function NamedList({ label, kind, entries, onRemove, onPick }: {
  label: string;
  kind?: string;
  entries: readonly NamedEntry[];
  onRemove?: (id: string) => void;
  onPick?: (result: AiCatalogSearchResult, replacingId?: string) => void;
})
{
  // `null` means the picker is closed; a string is the query it opens with, and
  // `replacing` distinguishes „add one more" from „swap this one out".
  const [picking, setPicking] = useState<{ query: string; replacing?: string } | null>(null);
  const canPick = Boolean(kind && onPick);

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="font-medium">{label}:</span>
      {entries.length === 0 && <span className="text-muted-foreground">brak</span>}
      {entries.map(entry => (
        <span key={entry.id} className="inline-flex items-center gap-1 rounded border px-2 py-0.5">
          {canPick
            ? (
              <button
                type="button"
                title="Zmień rangę lub podmień wpis"
                className="hover:underline"
                onClick={() => setPicking({ query: entry.name, replacing: entry.id })}
              >
                {entry.grade === undefined ? entry.name : `${entry.name} (${entry.grade})`}
              </button>
            )
            : entry.grade === undefined ? entry.name : `${entry.name} (${entry.grade})`}
          {onRemove && (
            <button
              type="button"
              aria-label={`Usuń ${entry.name}`}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(entry.id)}
            >
              ×
            </button>
          )}
        </span>
      ))}

      {canPick && (
        <Button type="button" variant="outline" size="sm" onClick={() => setPicking({ query: '' })}>
          + Dodaj
        </Button>
      )}

      {picking && kind && onPick && (
        <CatalogPicker
          kind={kind}
          title={picking.replacing ? `Podmień: ${label}` : `Dodaj: ${label}`}
          initialQuery={picking.query}
          onClose={() => setPicking(null)}
          onPick={result => {
            onPick(result, picking.replacing);
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}

type DefenseEntry = {
  id?: string;
  name: string;
  immunity: number; resistance: number; protection: number;
  block: number; parry: number; dodge: number; bonus: number;
};

type DamageEntry = { amount: number; grade: number; bonus: number; isPhantom: boolean };
type WeaponEntry = DamageEntry & { critical: { power: number; range: number } };
type OffenseEntry = {
  id?: string;
  name: string;
  leadingWeapon: WeaponEntry;
  secondaryWeapon?: WeaponEntry;
  damageBonus: DamageEntry;
  additionalDamageBonus?: DamageEntry;
};

/** Which slots of an attack set a reviewer edits, and what they are called. */
const OFFENCE_SLOTS: readonly { slot: keyof OffenseEntry; label: string; hasCritical: boolean }[] = [
  { slot: 'leadingWeapon', label: 'broń wiodąca', hasCritical: true },
  { slot: 'secondaryWeapon', label: 'broń drugorzędna', hasCritical: true },
  { slot: 'damageBonus', label: 'obrażenia', hasCritical: false },
  { slot: 'additionalDamageBonus', label: 'obrażenia dodatkowe', hasCritical: false },
];

/**
 * `grade` is a rung on the dice ladder, not the die itself — grade 5 is k10.
 * Reusing the sheet's own formatter keeps the preview honest; rendering
 * `k${grade}` showed a k8 sword as „k4".
 */
const dicePool = (pool: DamageEntry) => {
  const rendered = toOffenseString(pool);
  return rendered.length > 0 ? rendered : 'brak';
};

/**
 * One editable number, labelled.
 *
 * The combat sets are the character's own sheet rather than links to the
 * compendium, so every number in them is the reviewer's to set — and they are
 * the numbers the model gets wrong most often, which is why correcting them
 * here rather than after acceptance is worth the row of inputs.
 */
function NumberField({ label, value, onChange }: {
  label: string;
  value: number;
  onChange?: (value: number) => void;
})
{
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      {onChange
        ? (
          <NumericInput
            type="number"
            aria-label={label}
            className="w-14 rounded border bg-transparent px-1 py-0.5"
            value={value}
            onChange={event => onChange(parseRequiredNumberInput(event.target.value))}
          />
        )
        : <span className="text-foreground">{value}</span>}
    </span>
  );
}

const HEALTH_FIELDS: readonly { field: string; label: string }[] = [
  { field: 'vitality', label: 'żywotność' },
  { field: 'barrier', label: 'bariera' },
  { field: 'toughness', label: 'twardość' },
  { field: 'recoveryLevel', label: 'regeneracja' },
  { field: 'lethalHealth', label: 'przeżywalność' },
  { field: 'lethalRounds', label: 'determinacja' },
  { field: 'bonus', label: 'bonus' },
];

const DEFENCE_FIELDS: readonly { field: keyof DefenseEntry; label: string }[] = [
  { field: 'immunity', label: 'niewrażliwość' },
  { field: 'resistance', label: 'odporność' },
  { field: 'protection', label: 'pancerz' },
  { field: 'block', label: 'blokowanie' },
  { field: 'parry', label: 'parowanie' },
  { field: 'dodge', label: 'unikanie' },
  { field: 'bonus', label: 'bonus' },
];

function DefenseCard({ defenses, defaultId, onChange, onDefault }: {
  defenses: readonly DefenseEntry[];
  defaultId?: string | null;
  onChange?: (index: number, field: keyof DefenseEntry, value: number) => void;
  onDefault?: (id: string) => void;
})
{
  if (defenses.length === 0) return <p className="text-sm text-muted-foreground">Brak zestawów obrony.</p>;

  return (
    <div className="space-y-3">
      {defenses.map((defense, index) => (
        <div key={defense.id ?? defense.name} className="rounded-md border px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{defense.name}</p>
            {onDefault && defense.id && (
              <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="radio"
                  name="ai-default-defense"
                  checked={defaultId === defense.id}
                  onChange={() => onDefault(defense.id!)}
                />
                domyślny
              </label>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            {DEFENCE_FIELDS.map(({ field, label }) => (
              <NumberField
                key={field}
                label={label}
                value={defense[field] as number}
                onChange={onChange && (value => onChange(index, field, value))}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OffenseCard({ offenses, defaultId, onChange, onDefault }: {
  offenses: readonly OffenseEntry[];
  defaultId?: string | null;
  onChange?: (index: number, slot: keyof OffenseEntry, path: string, value: number) => void;
  onDefault?: (id: string) => void;
})
{
  if (offenses.length === 0) return <p className="text-sm text-muted-foreground">Brak zestawów ataku.</p>;

  return (
    <div className="space-y-3">
      {offenses.map((offense, index) => (
        <div key={offense.id ?? offense.name} className="space-y-2 rounded-md border px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{offense.name}</p>
            {onDefault && offense.id && (
              <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="radio"
                  name="ai-default-offense"
                  checked={defaultId === offense.id}
                  onChange={() => onDefault(offense.id!)}
                />
                domyślny
              </label>
            )}
          </div>

          {OFFENCE_SLOTS.map(({ slot, label, hasCritical }) => {
            const pool = offense[slot] as WeaponEntry | undefined;
            // An absent optional slot stays absent: filling it with zeros is
            // what makes a one-handed swordsman look like a dual wielder.
            if (!pool) return null;

            return (
              <div key={slot} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                <span className="w-40 shrink-0">
                  {label} <span className="text-foreground">{dicePool(pool)}</span>
                  {hasCritical && pool.amount > 0 && ` (krytyk ${toCriticalRangeString(pool as WeaponEntry)})`}
                </span>
                <NumberField label="kości" value={pool.amount} onChange={onChange && (value => onChange(index, slot, 'amount', value))} />
                <NumberField label="ranga" value={pool.grade} onChange={onChange && (value => onChange(index, slot, 'grade', value))} />
                <NumberField label="bonus" value={pool.bonus} onChange={onChange && (value => onChange(index, slot, 'bonus', value))} />
                {hasCritical && (
                  <>
                    <NumberField label="siła kryt." value={pool.critical.power} onChange={onChange && (value => onChange(index, slot, 'critical.power', value))} />
                    <NumberField label="zasięg kryt." value={pool.critical.range} onChange={onChange && (value => onChange(index, slot, 'critical.range', value))} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const BAND_STYLES: Record<BalanceComparison['speciality']['band'], string> = {
  'poniżej mediany': 'text-amber-600',
  'w normie': 'text-muted-foreground',
  'wysoko': 'text-muted-foreground',
  'powyżej maksimum': 'text-amber-600',
};

/**
 * Where the draft sits against characters of its kind.
 *
 * A bare „8" says nothing; „8 przy medianie 3 i p90 7" is a judgement the
 * reviewer can check. Nothing here blocks anything — a character outside the
 * band is unusual, not wrong, and telling those apart is the reviewer's job.
 */
function BalanceCard({ comparisons }: { comparisons: readonly BalanceComparison[] })
{
  if (comparisons.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Żaden tag tej postaci nie ma dość postaci w kompendium, żeby wyliczyć profil.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comparisons.map(comparison => (
        <div key={comparison.tag} className="space-y-2 text-sm">
          <p className="font-medium">
            {comparison.tag}{' '}
            <span className="font-normal text-muted-foreground">({comparison.characters} postaci w kompendium)</span>
          </p>

          <p>
            <span className="font-medium">Specjalność:</span>{' '}
            {comparison.speciality.name} {comparison.speciality.value}
            {' '}<span className="text-muted-foreground">
              (mediana {comparison.speciality.median}, p90 {comparison.speciality.high}, max {comparison.speciality.max})
            </span>{' '}
            <span className={BAND_STYLES[comparison.speciality.band]}>— {comparison.speciality.band}</span>
          </p>

          <p>
            <span className="font-medium">Manewrów:</span> {comparison.maneuvers.value}
            {' '}<span className="text-muted-foreground">
              (mediana {comparison.maneuvers.median}, p90 {comparison.maneuvers.high})
            </span>{' '}
            <span className={BAND_STYLES[comparison.maneuvers.band]}>— {comparison.maneuvers.band}</span>
            {'; '}
            <span className="font-medium">atutów:</span> {comparison.perks.value}
            {' '}<span className="text-muted-foreground">
              (mediana {comparison.perks.median}, p90 {comparison.perks.high})
            </span>
          </p>

          {/* Only the attributes worth a second look; nine rows of „w normie"
              would bury the two that are not. */}
          {comparison.attributes.filter(attribute => attribute.band !== 'w normie' && attribute.value > 0).length > 0 && (
            <ul className="list-disc space-y-1 pl-5">
              {comparison.attributes
                .filter(attribute => attribute.band !== 'w normie' && attribute.value > 0)
                .map(attribute => (
                  <li key={attribute.name}>
                    {attribute.name} {attribute.value}
                    {' '}<span className="text-muted-foreground">
                      (mediana {attribute.median}, p90 {attribute.high}, max {attribute.max})
                    </span>{' '}
                    <span className={BAND_STYLES[attribute.band]}>— {attribute.band}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function ProposalPreview({
  draft,
  onDiscard,
  isDiscarding,
  onAccept,
  isAccepting,
  onSave,
  isSaving,
  balance,
}: {
  draft: AiCharacterDraft;
  onDiscard: () => void;
  isDiscarding: boolean;
  onAccept: () => void;
  isAccepting: boolean;
  onSave: (proposal: AiCharacterProposal, onSaved: () => void) => void;
  isSaving: boolean;
  balance: readonly BalanceComparison[] | undefined;
})
{
  // Edits live here until saved, so removing three maneuvers costs one request
  // rather than three, and „Odrzuć zmiany" is a real option.
  const [edited, setEdited] = useState<AiCharacterProposal | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const proposal = edited ?? draft.proposal;
  if (!proposal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wersja robocza wymaga sprawdzenia</CardTitle>
          <CardDescription>Model nie zwrócił poprawnej propozycji do podglądu.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { header, perks, statistics, combat, equipment, talents, explanation, warnings } = proposal;
  const isDirty = edited !== null;

  const edit = (change: (draftProposal: AiCharacterProposal) => AiCharacterProposal) =>
    setEdited(change(structuredClone(proposal)));

  const removeFrom = <T extends { id: string }>(entries: T[], id: string) => entries.filter(entry => entry.id !== id);

  /**
   * Puts a picked compendium record into a collection, either in place of the
   * one being swapped or at the end.
   *
   * The record replaces the old one whole rather than having its rank patched
   * over the top: each rank is a separate compendium record with its own
   * requirements and price, so keeping the old identifier and writing a new
   * number would make the draft describe a character it does not link to.
   */
  const applyPick = <T extends { id: string }>(entries: T[], result: AiCatalogSearchResult, replacing?: string): T[] => {
    const picked = result.entry as unknown as T;
    if (entries.some(entry => entry.id === picked.id)) return replacing ? removeFrom(entries, replacing) : entries;

    return replacing
      ? entries.map(entry => entry.id === replacing ? picked : entry)
      : [...entries, picked];
  };

  return (
    <div className="space-y-4">
      {isDirty && (
        <Card className="border-primary/60">
          <CardHeader>
            <CardTitle>Niezapisane zmiany</CardTitle>
            <CardDescription>
              Zapisanie przeliczy uwagi do wersji roboczej i porównanie z balansem. Możesz usuwać wpisy,
              dopisywać je z kompendium, podmieniać rangi i poprawiać wartości cech.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => {
              const parsed = aiCharacterProposalSchema.safeParse(proposal);
              if (!parsed.success) {
                setEditError(parsed.error.issues[0]?.message ?? 'Uzupełnij pole');
                return;
              }
              setEditError(null);
              onSave(parsed.data, () => setEdited(current => current === edited ? null : current));
            }} disabled={isSaving}>
              {isSaving ? 'Zapisywanie…' : 'Zapisz zmiany'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEdited(null)} disabled={isSaving}>
              Odrzuć zmiany
            </Button>
          </CardContent>
          {editError && <p role="alert" className="px-6 pb-4 text-sm text-destructive">{editError}</p>}
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{header.name}</CardTitle>
          <CardDescription>{header.shortName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap">{header.description}</p>
          <TagEditor
            tags={header.tags}
            onChange={tags => edit(next => ({ ...next, header: { ...next.header, tags } }))}
          />
          <RaceEditor
            raceId={header.raceId}
            onPick={result => edit(next => ({ ...next, header: { ...next.header, raceId: result.id } }))}
            onClear={() => edit(next => ({ ...next, header: { ...next.header, raceId: null } }))}
          />
          <p className="text-xs text-muted-foreground">
            Tagi decydują, z jakimi postaciami kompendium porównywany jest balans tej wersji roboczej.
          </p>
          <p className="text-sm text-muted-foreground">Provider: {draft.provider}, model: {draft.model}, koszt: {formatCost(draft.costMicroUsd)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Uzasadnienie modelu</CardTitle></CardHeader>
        <CardContent><p className="whitespace-pre-wrap">{explanation}</p></CardContent>
      </Card>

      {/* Two different things: what the model flagged about its own work, and
          what the acceptance rules already know will fail. The second blocks. */}
      {draft.validationIssues.length > 0 && (
        <Card className="border-destructive/60">
          <CardHeader>
            <CardTitle>Do poprawienia po zapisie</CardTitle>
            <CardDescription>
              Możesz zatwierdzić mimo tego — postać powstanie z tymi brakami i dokończysz ją w edytorze.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {draft.validationIssues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {warnings.length > 0 && (
        <Card className="border-amber-500/60">
          <CardHeader><CardTitle>Ostrzeżenia do sprawdzenia</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Charakterystyki</CardTitle></CardHeader>
        <CardContent>
          <StatisticGrid
            values={statistics.characteristics}
            onChange={(key, field, value) => edit(next => {
              (next.statistics.characteristics as Record<string, StatisticValue>)[key][field] = value;
              return next;
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Atrybuty</CardTitle></CardHeader>
        <CardContent>
          <StatisticGrid
            values={statistics.attributes}
            onChange={(key, field, value) => edit(next => {
              (next.statistics.attributes as Record<string, StatisticValue>)[key][field] = value;
              return next;
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Walka i rozwój</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="font-medium text-foreground">Zdrowie:</span>
            {HEALTH_FIELDS.map(({ field, label }) => (
              <NumberField
                key={field}
                label={label}
                value={(combat.health as unknown as Record<string, number>)[field] ?? 0}
                onChange={value => edit(next => {
                  (next.combat.health as unknown as Record<string, number>)[field] = value;
                  return next;
                })}
              />
            ))}
          </div>
          {/* Named entries rather than counts: these come from the compendium,
              and a count cannot tell you whether the model picked the right one. */}
          <NamedList
            label="Atuty"
            kind="perk"
            entries={perks}
            onRemove={id => edit(next => ({ ...next, perks: removeFrom(next.perks, id) }))}
            onPick={(result, replacing) => edit(next => ({ ...next, perks: applyPick(next.perks, result, replacing) }))}
          />
          {/* Talents are written on the sheet, not drawn from a collection, so
              there is nothing to pick them from. */}
          <NamedList label="Talenty" entries={talents.talents} onRemove={id => edit(next => ({ ...next, talents: { talents: removeFrom(next.talents.talents, id) } }))} />
          <NamedList
            label="Manewry"
            kind="maneuver"
            entries={combat.maneuvers}
            onRemove={id => edit(next => ({ ...next, combat: { ...next.combat, maneuvers: removeFrom(next.combat.maneuvers, id) } }))}
            onPick={(result, replacing) => edit(next => ({ ...next, combat: { ...next.combat, maneuvers: applyPick(next.combat.maneuvers, result, replacing) } }))}
          />
          <NamedList
            label="Postawy"
            kind="stance"
            entries={combat.stances}
            onRemove={id => edit(next => ({ ...next, combat: { ...next.combat, stances: removeFrom(next.combat.stances, id) } }))}
            onPick={(result, replacing) => edit(next => ({ ...next, combat: { ...next.combat, stances: applyPick(next.combat.stances, result, replacing) } }))}
          />
          <NamedList
            label="Stany"
            kind="state"
            entries={combat.states}
            onRemove={id => edit(next => ({ ...next, combat: { ...next.combat, states: removeFrom(next.combat.states, id) } }))}
            onPick={(result, replacing) => edit(next => ({ ...next, combat: { ...next.combat, states: applyPick(next.combat.states, result, replacing) } }))}
          />
          {/* A power is a character's own construction around a specification,
              not a compendium record to be swapped in whole. */}
          <NamedList label="Moce" entries={combat.powers} onRemove={id => edit(next => ({ ...next, combat: { ...next.combat, powers: removeFrom(next.combat.powers, id) } }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Odchylenie od profilu</CardTitle>
          <CardDescription>
            Porównanie z postaciami o tych samych tagach, liczone z kompendium. To opis zwyczaju, nie reguła —
            postać poza przedziałem jest nietypowa, a nie błędna.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {balance === undefined
            ? <p className="text-sm text-muted-foreground">Liczenie…</p>
            : <BalanceCard comparisons={balance} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Obrona</CardTitle>
          <CardDescription>
            {combat.defaultDefenseId
              ? 'Zestaw oznaczony jako domyślny jest używany, dopóki nie przełączysz go w karcie postaci.'
              : 'Żaden zestaw nie jest domyślny — wybierzesz go w edytorze.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DefenseCard
            defenses={combat.defenses as DefenseEntry[]}
            defaultId={combat.defaultDefenseId}
            onChange={(index, field, value) => edit(next => {
              (next.combat.defenses[index] as unknown as Record<string, number>)[field] = value;
              return next;
            })}
            onDefault={id => edit(next => ({ ...next, combat: { ...next.combat, defaultDefenseId: id } }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atak</CardTitle>
          <CardDescription>
            {combat.defaultOffenseId
              ? 'Zestaw oznaczony jako domyślny jest używany, dopóki nie przełączysz go w karcie postaci.'
              : 'Żaden zestaw nie jest domyślny — wybierzesz go w edytorze.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OffenseCard
            offenses={combat.offenses as OffenseEntry[]}
            defaultId={combat.defaultOffenseId}
            onChange={(index, slot, path, value) => edit(next => {
              const target = (next.combat.offenses[index] as unknown as Record<string, Record<string, unknown>>)[slot];
              const [head, tail] = path.split('.');
              if (tail) (target[head] as Record<string, number>)[tail] = value;
              else (target as Record<string, number>)[head] = value;
              return next;
            })}
            onDefault={id => edit(next => ({ ...next, combat: { ...next.combat, defaultOffenseId: id } }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ekwipunek</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <NamedList
            label="Bronie"
            kind="weapon"
            entries={equipment.weapons}
            onRemove={id => edit(next => ({ ...next, equipment: { ...next.equipment, weapons: removeFrom(next.equipment.weapons, id) } }))}
            onPick={(result, replacing) => edit(next => ({ ...next, equipment: { ...next.equipment, weapons: applyPick(next.equipment.weapons, result, replacing) } }))}
          />
          <NamedList
            label="Zbroje"
            kind="armor"
            entries={equipment.armors}
            onRemove={id => edit(next => ({ ...next, equipment: { ...next.equipment, armors: removeFrom(next.equipment.armors, id) } }))}
            onPick={(result, replacing) => edit(next => ({ ...next, equipment: { ...next.equipment, armors: applyPick(next.equipment.armors, result, replacing) } }))}
          />
          <NamedList
            label="Tarcze"
            kind="shield"
            entries={equipment.shields}
            onRemove={id => edit(next => ({ ...next, equipment: { ...next.equipment, shields: removeFrom(next.equipment.shields, id) } }))}
            onPick={(result, replacing) => edit(next => ({ ...next, equipment: { ...next.equipment, shields: applyPick(next.equipment.shields, result, replacing) } }))}
          />
          <NamedList
            label="Przedmioty"
            kind="inventoryItem"
            entries={equipment.inventory}
            onRemove={id => edit(next => ({ ...next, equipment: { ...next.equipment, inventory: removeFrom(next.equipment.inventory, id) } }))}
            onPick={(result, replacing) => edit(next => ({ ...next, equipment: { ...next.equipment, inventory: applyPick(next.equipment.inventory, result, replacing) } }))}
          />
          <NamedList
            label="Wierzchowce"
            kind="mount"
            entries={equipment.mounts}
            onRemove={id => edit(next => ({ ...next, equipment: { ...next.equipment, mounts: removeFrom(next.equipment.mounts, id) } }))}
            onPick={(result, replacing) => edit(next => ({ ...next, equipment: { ...next.equipment, mounts: applyPick(next.equipment.mounts, result, replacing) } }))}
          />
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Następny krok</CardTitle>
          <CardDescription>Zatwierdzenie ponownie sprawdzi dane i zapisze postać atomowo. Możesz potem otworzyć ją w zwykłym edytorze.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button type="button" onClick={onAccept} disabled={isAccepting || isDiscarding}>
            {isAccepting
              ? 'Zapisywanie postaci…'
              : draft.validationIssues.length > 0
                ? 'Zatwierdź mimo braków i popraw w edytorze'
                : 'Zatwierdź i utwórz postać'}
          </Button>
          <Button type="button" variant="outline" onClick={onDiscard} disabled={isDiscarding}>
            {isDiscarding ? 'Odrzucanie…' : 'Odrzuć tę wersję roboczą'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export type AiCharacterGenerationViewProps = {
  /** Server-side setting; decides whether generating calls a model at all. */
  provider?: 'openai' | 'ollama' | 'local';
};

export default function AiCharacterGenerationView({ provider }: AiCharacterGenerationViewProps = {})
{
  // The local provider reads a draft prepared outside the application, so
  // „generate" would promise something it never does.
  const isLocal = provider === 'local';
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [references, setReferences] = useState<CharacterSummary[]>([]);
  const [draft, setDraft] = useState<AiCharacterDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allowCustomEquipment, setAllowCustomEquipment] = useState(false);
  const [allowCustomAbilities, setAllowCustomAbilities] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => aiCharacterDraftsClient.create({
      description: description.trim(),
      referenceCharacterIds: references.map(reference => reference.id),
      constraints: {
        language: 'pl-PL',
        allowCustomEquipment,
        allowCustomAbilities,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
    }),
    onSuccess: generatedDraft => {
      setDraft(generatedDraft);
      setErrorMessage(null);
    },
    onError: error => setErrorMessage(getGenerationErrorMessage(error)),
  });

  const discardMutation = useMutation({
    mutationFn: async (id: string) => aiCharacterDraftsClient.reject(id),
    onSuccess: () => setDraft(null),
    onError: error => setErrorMessage(getGenerationErrorMessage(error)),
  });

  // Recomputed whenever the draft changes, including after an edit is saved —
  // trimming three maneuvers moves the character on the scale.
  const balanceQuery = useQuery({
    queryKey: ['ai-character-draft-balance', draft?.id, draft?.updatedAt],
    queryFn: async () => aiCharacterDraftsClient.balance(draft!.id),
    enabled: Boolean(draft?.proposal),
  });

  const saveMutation = useMutation({
    mutationFn: async (proposal: AiCharacterProposal) => aiCharacterDraftsClient.update(draft!.id, proposal),
    onSuccess: savedDraft => {
      setDraft(savedDraft);
      setErrorMessage(null);
    },
    onError: error => setErrorMessage(getGenerationErrorMessage(error)),
  });

  // Offline only: the workspace file, not the draft in the database.
  const discardLocalDraftMutation = useMutation({
    mutationFn: async () => aiCharacterDraftsClient.discardPreparedLocalDraft(),
    onError: error => setErrorMessage(getGenerationErrorMessage(error)),
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => draft?.reviewedRevision ? aiCharacterDraftsClient.accept(id, draft.reviewedRevision) : aiCharacterDraftsClient.accept(id),
    onSuccess: characterId => router.push(`/characters/${characterId}/edit?tab=character`),
    onError: error => setErrorMessage(getGenerationErrorMessage(error)),
  });

  const canGenerate = description.trim().length >= MIN_DESCRIPTION_LENGTH && !generateMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-10 pt-8">
      <Card>
        <CardHeader>
          <CardTitle>Generuj postać z AI</CardTitle>
          <CardDescription>Opis i wybrane referencje trafiają do serwera aplikacji, który buduje wersję roboczą. Postać nie zostanie jeszcze zapisana.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="ai-character-description" className="font-medium">Opis postaci</label>
            <Textarea
              id="ai-character-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Np. doświadczony zwiadowca z magią lodu, walczący z dystansu i unikający ciężkiego pancerza."
              className="min-h-36 resize-y"
              maxLength={4_000}
            />
            <p className="text-right text-xs text-muted-foreground">{description.length}/4000</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="ai-character-notes" className="font-medium">Dodatkowe ograniczenia (opcjonalne)</label>
            <Textarea
              id="ai-character-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Np. klimat północny, bez ciężkiego pancerza, nazwy po polsku."
              className="min-h-24 resize-y"
              maxLength={2_000}
            />
          </div>

          <div className="space-y-3">
            <p className="font-medium">Tworzenie nowych wpisów kompendium</p>
            <p className="text-sm text-muted-foreground">
              Domyślnie model może wybierać wyłącznie z istniejącego kompendium. Zaznaczenie pozwala mu dopisać
              nowe wpisy pod tę postać — trafią one do wspólnej bazy po zatwierdzeniu.
            </p>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={allowCustomEquipment}
                onChange={event => setAllowCustomEquipment(event.target.checked)}
              />
              <span>Wolno wymyślić ekwipunek (bronie, zbroje, tarcze, przedmioty, wierzchowce)</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={allowCustomAbilities}
                onChange={event => setAllowCustomAbilities(event.target.checked)}
              />
              <span>Wolno wymyślić zdolności (atuty, manewry, postawy, stany)</span>
            </label>
          </div>

          <ReferencePicker
            references={references}
            onAdd={summary => setReferences(current => [...current, summary])}
            onRemove={id => setReferences(current => current.filter(reference => reference.id !== id))}
          />

          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
            {isLocal
              ? 'Tryb lokalny: aplikacja nie woła żadnego modelu. Pierwsze kliknięcie zapisze kontekst tego żądania do folderu ai-workspace/requests, a po przygotowaniu propozycji w ai-workspace/drafts/draft.json kliknij ponownie, żeby ją wczytać. Nic to nie kosztuje.'
              : 'Generowanie może zużyć część budżetu API. Serwer rezerwuje maksymalny koszt przed wywołaniem i blokuje żądanie po osiągnięciu ustawionego limitu.'}

            {/* Wczytanie nie zjada pliku, żeby nieudany przegląd dało się
                powtórzyć — więc kolejne kliknięcie wczytałoby tę samą postać. */}
            {isLocal && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => discardLocalDraftMutation.mutate()}
                  disabled={discardLocalDraftMutation.isPending}
                >
                  {discardLocalDraftMutation.isPending ? 'Usuwanie…' : 'Usuń przygotowaną wersję roboczą'}
                </Button>
                {discardLocalDraftMutation.isSuccess && (
                  <span className="text-xs">
                    {discardLocalDraftMutation.data
                      ? 'Usunięto draft.json — przygotuj nowy, zanim wczytasz ponownie.'
                      : 'Nie było czego usuwać.'}
                  </span>
                )}
              </div>
            )}
          </div>

          {errorMessage && <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>}

          <Button type="button" onClick={() => generateMutation.mutate()} disabled={!canGenerate}>
            {generateMutation.isPending
              ? (isLocal ? 'Wczytywanie wersji roboczej…' : 'Generowanie wersji roboczej…')
              : isLocal
                ? 'Wczytaj przygotowaną wersję roboczą'
                : draft ? 'Wygeneruj nową wersję' : 'Wygeneruj wersję roboczą'}
          </Button>
        </CardContent>
      </Card>

      {draft && (
        <ProposalPreview
          draft={draft}
          onDiscard={() => discardMutation.mutate(draft.id)}
          isDiscarding={discardMutation.isPending}
          onAccept={() => acceptMutation.mutate(draft.id)}
          onSave={(proposal, onSaved) => saveMutation.mutate(proposal, { onSuccess: onSaved })}
          isSaving={saveMutation.isPending}
          balance={balanceQuery.data}
          isAccepting={acceptMutation.isPending}
        />
      )}
    </div>
  );
}
