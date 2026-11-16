"use client";

import { useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Checkbox } from '@/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { tagEntityModelMap } from '@/lib/tagEntityModels';
import type { TagDefinitionRecord, TagFacetDefinition } from '@/domain/tags/tagFacets';
import type { TagFacetDrift } from '@/domain/tags/tagFacetDrift';
import { entityLabel, entityLabels } from '@/common/translations/entityLabels';
import tagFacetsClient, { TagFacetError, type TagFacetLayer } from '@/infrastructure/clients/tagFacetsClient';

const ENTITY_OPTIONS = Object.keys(tagEntityModelMap);

type SaveFn = (body: Record<string, unknown>) => Promise<boolean>;

/**
 * Facet management (Wave 10.5)
 *
 * Three levels, in the order they matter: the drift report at the top (a tag
 * nobody grouped should be the first thing an admin sees, not something found by
 * accident), then tag→facet assignment, then the alias editor.
 *
 * Aliases get the most ceremony because they are the only edit here that can
 * produce a WRONG search result rather than a worse-looking dropdown — the
 * server rejects the three illegal shapes, and the error is shown verbatim
 * rather than reduced to "save failed".
 */
export default function TagFacetsPanel()
{
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const { data: layer } = useQuery<TagFacetLayer>({
    queryKey: ['tagFacetAdmin'],
    queryFn: tagFacetsClient.getLayer,
  });

  const { data: drift } = useQuery<TagFacetDrift>({
    queryKey: ['tagFacetDrift'],
    queryFn: tagFacetsClient.getDrift,
  });

  const facets = useMemo(() => [...(layer?.facets ?? [])].sort((a, b) => a.order - b.order), [layer]);
  const definitions = layer?.definitions ?? [];

  const run = async (action: () => Promise<void>): Promise<boolean> =>
  {
    setBusy(true);
    setError('');

    try
    {
      await action();
    }
    catch (caught)
    {
      // Alias violations come back as readable Polish naming the exact conflict,
      // so they are shown verbatim rather than flattened to "save failed".
      setError(caught instanceof TagFacetError ? caught.message : 'Nie udało się zapisać.');
      return false;
    }
    finally
    {
      setBusy(false);
    }

    await queryClient.invalidateQueries({ queryKey: ['tagFacetAdmin'] });
    await queryClient.invalidateQueries({ queryKey: ['tagFacetDrift'] });
    await queryClient.invalidateQueries({ queryKey: ['tagFacets'] });
    return true;
  };

  const save: SaveFn = body =>
  {
    if (body.resource === 'facet')
    {
      return body.action === 'delete'
        ? run(() => tagFacetsClient.deleteFacet(body.key as string))
        : run(() => tagFacetsClient.upsertFacet(body as never));
    }

    return body.action === 'delete'
      ? run(() => tagFacetsClient.deleteDefinition(body.tag as string))
      : run(() => tagFacetsClient.upsertDefinition(body as never));
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>}

      <CategoriesHelp />

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Rozjazd kategorii</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cztery kontrole warstwy opisowej, uszeregowane od błędu do porządków. Żadna nie dotyka wpisów —
          najgorsze, co robi rozjazd, to gorsze grupowanie w filtrze.
        </p>

        {/* Kolejność jest treścią: pierwszy blok to jedyny, który potrafi
            skłamać, ostatni to kosmetyka. Bez tego wszystkie cztery wyglądały
            jak jedna lista usterek i nie było wiadomo, co jest pilne. */}
        <DriftBlock
          tone="error"
          title="Przypisania bez efektu"
          count={drift?.ineffectiveAssignments.length ?? 0}
          what="Tag ma kategorię, ale ta kategoria nie obejmuje ŻADNEJ listy, na której ten tag występuje. Filtr nigdy go nie pokaże, a z „Tagów bez kategorii” już zniknął — wygląda na zrobione, a nie działa. Jedyny rodzaj rozjazdu, który wprowadza w błąd."
          todo="Przestaw tag na kategorię obejmującą właściwą listę — lista wyboru pokazuje tylko takie."
          empty="Nic takiego — każde przypisanie sięga tam, gdzie tag naprawdę występuje."
        >
          {drift?.ineffectiveAssignments.map(entry => (
            <li key={entry.tag} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0 text-sm">
                <span className="font-medium">{entry.tag}</span>
                <span className="ml-2 text-muted-foreground">
                  jest na: {entityLabels(entry.tagEntities)} · kategoria „{entry.facetKey}” obejmuje: {entityLabels(entry.facetEntities)}
                </span>
              </div>

              <CategoryPicker
                facets={facets}
                tagEntities={entry.tagEntities}
                value={entry.facetKey}
                busy={busy}
                onChange={facetKey => void save({
                  resource: 'definition', action: 'upsert', tag: entry.tag, facetKey, aliases: [],
                })}
              />
            </li>
          ))}
        </DriftBlock>

        <DriftBlock
          tone="todo"
          title="Tagi bez kategorii"
          count={drift?.undefinedTags.length ?? 0}
          what="Żadna kategoria ich nie obejmuje, więc nie grupują się w filtrze. Nie znikają: trafiają do „Pozostałych”, a tryb „Tagi” dalej je znajduje. Liczba przy tagu to wystąpienia w bibliotece — im większa, tym bardziej opłaca się dać mu oś."
          todo="Przypisz listą wyboru obok. Jeśli żadna oś nie pasuje, utwórz kategorię formularzem niżej. Część tagów zostaje tu celowo — „specjalne” to worek na wyjątki, nie oś."
          empty="Wszystkie tagi mają kategorię."
        >
          {drift?.undefinedTags.map(entry => (
            <li key={entry.tag} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0 text-sm">
                <span className="font-medium">{entry.tag}</span>
                <span className="ml-2 text-muted-foreground">
                  {entry.occurrences}× · {entityLabels(entry.entities)}
                </span>
              </div>

              <CategoryPicker
                facets={facets}
                tagEntities={entry.entities}
                busy={busy}
                onChange={facetKey => void save({
                  resource: 'definition', action: 'upsert', tag: entry.tag, facetKey, aliases: [],
                })}
              />
            </li>
          ))}
        </DriftBlock>

        <DriftBlock
          tone="info"
          title="Kategorie, które nie sięgają wszędzie"
          count={drift?.partialCoverage.length ?? 0}
          what="Kategoria działa na swoich listach, ale te same tagi są też na innych — i tam lądują w „Pozostałych”. Nic zepsutego, tylko niedokończone."
          todo="Jedna decyzja na wiersz: rozszerz zakres kategorii („Edytuj” na jej karcie) albo zostaw, jeśli na tamtej liście to słowo znaczy co innego."
        >
          {drift?.partialCoverage.map(entry => (
            <li key={`${entry.facetKey}-${entry.entity}`} className="px-3 py-2 text-sm">
              <span className="font-medium">{facets.find(facet => facet.key === entry.facetKey)?.label ?? entry.facetKey}</span>
              <span className="text-muted-foreground"> mogłaby objąć </span>
              <span className="font-medium">{entityLabel(entry.entity)}</span>
              <span className="ml-1 text-muted-foreground">
                — jest tam {entry.tags.length === 1 ? '1 tag' : `${entry.tags.length} tagi`} tej kategorii: {entry.tags.join(', ')}
              </span>
            </li>
          ))}
        </DriftBlock>

        <DriftBlock
          tone="muted"
          title="Porządki"
          count={(drift?.unusedDefinitions.length ?? 0) + (drift?.deadFacetEntities.length ?? 0)}
          what="Definicje, których napisu nie ma na żadnym wpisie, i kategorie, które na danej liście nie mają ani jednej wartości. Zwykle pozostałości po scaleniu kategorii albo po przemianowaniu tagu poza panelem."
          todo="Nic nie psują — w filtrze puste kategorie i tak są niewidoczne. Można skasować, kiedy przeszkadzają."
        >
          {drift && drift.unusedDefinitions.length > 0 && (
            <li className="px-3 py-2 text-sm">
              <span className="font-medium">Definicje bez użycia ({drift.unusedDefinitions.length}):</span>{' '}
              <span className="text-muted-foreground">{drift.unusedDefinitions.map(entry => entry.tag).join(', ')}</span>
            </li>
          )}
          {drift && drift.deadFacetEntities.length > 0 && (
            <li className="px-3 py-2 text-sm">
              <span className="font-medium">Kategorie bez treści ({drift.deadFacetEntities.length}):</span>{' '}
              <span className="text-muted-foreground">
                {drift.deadFacetEntities.map(entry => `${entry.facetKey} → ${entityLabel(entry.entity)}`).join(', ')}
              </span>
            </li>
          )}
        </DriftBlock>
      </section>

      <AddFacetForm busy={busy} onSave={save} />

      {
        facets.map(facet => (
          <FacetCard
            key={facet.key}
            facet={facet}
            definitions={definitions.filter(definition => definition.facetKey === facet.key)}
            allFacets={facets}
            tagEntities={drift?.tagEntities ?? {}}
            busy={busy}
            onSave={save}
          />
        ))
      }

      {
        definitions.some(definition => !definition.facetKey) && (
          <section className="rounded-lg border border-dashed p-4">
            <h2 className="text-lg font-semibold">Tagi bez kategorii</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {
                definitions.filter(definition => !definition.facetKey).map(definition => (
                  <AssignmentChip
                    key={definition.tag}
                    definition={definition}
                    facets={facets}
                    tagEntities={drift?.tagEntities?.[definition.tag] ?? []}
                    busy={busy}
                    onSave={save}
                  />
                ))
              }
            </div>
          </section>
        )
      }
    </div>
  );
}

/**
 * Instrukcja w miejscu użycia.
 *
 * Model jest prosty, ale ma dwie zasady, których nie da się odgadnąć z UI
 * (jeden tag = jedna kategoria; „— brak —" neguje całą oś razem z aliasami),
 * a złamanie ich daje cicho zły wynik wyszukiwania. Domyślnie zwinięta, żeby
 * nie zawadzała komuś, kto wie co robi.
 */
const NONE_VALUE = '__none__';

/**
 * Wybór kategorii dla taga.
 *
 * Dwie rzeczy, których brak spowodował realną pomyłkę: nazwa niesie **zakres**
 * („Pochodzenie (Wierzchowce)”), bo sam label bywa nieodróżnialny; a lista jest
 * zawężona do kategorii obejmujących listy, na których tag naprawdę występuje —
 * przypisanie poza zakres nie robi nic, a tag i tak znika z „Nieprzypisanych”.
 */
type DriftTone = 'error' | 'todo' | 'info' | 'muted';

const DRIFT_TONES: Record<DriftTone, { frame: string; head: string; badge: string }> =
{
  error: { frame: 'border-red-500/40', head: 'bg-red-500/10', badge: 'bg-red-500/20' },
  todo: { frame: '', head: 'bg-muted', badge: 'bg-primary text-primary-foreground' },
  info: { frame: '', head: 'bg-muted', badge: 'bg-muted-foreground/20' },
  muted: { frame: 'border-dashed', head: '', badge: 'bg-muted-foreground/20' },
};

/**
 * Jeden kierunek rozjazdu, opisany na miejscu.
 *
 * Wcześniej wszystkie cztery dzieliły jedno zdanie wstępu nad sekcją, opisujące
 * tak naprawdę tylko jeden z nich — więc nie dało się zgadnąć, co znaczą
 * pozostałe. Każdy blok mówi teraz sam: **co to jest** i **co z tym zrobić**.
 * Wskazówka „co zrobić" nie powtarza się w każdym wierszu, bo dla całego bloku
 * jest ta sama, a trzynaście kopii czyta się jak szum.
 */
function DriftBlock({ tone, title, count, what, todo, empty, children }: {
  tone: DriftTone;
  title: string;
  count: number;
  what: string;
  todo: string;
  /** Podany = blok pokazuje się także pusty, z tym zdaniem. Bez tego znika. */
  empty?: string;
  children: ReactNode;
})
{
  if (count === 0 && !empty) return null;

  // Pusty blok nie straszy: czerwień ma znaczyć „jest problem", a nie „tu bywa
  // problem". Zero zostaje na ekranie tylko po to, żeby było widać, że kontrola
  // się odbyła — dlatego neutralnie.
  const style = count === 0 ? DRIFT_TONES.muted : DRIFT_TONES[tone];

  return (
    <div className={`mt-3 overflow-hidden rounded-md border ${style.frame}`}>
      <div className={`px-3 py-2 ${style.head}`}>
        <p className="text-sm font-medium">
          {title}
          <span className={`ml-2 rounded px-1.5 text-xs font-normal ${style.badge}`}>{count}</span>
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{what}</p>
        {count > 0 && <p className="mt-1 text-xs leading-snug text-muted-foreground"><strong>Co zrobić:</strong> {todo}</p>}
      </div>

      {
        count === 0
          ? <p className="px-3 py-2 text-sm text-muted-foreground">{empty}</p>
          : <ul className="divide-y border-t">{children}</ul>
      }
    </div>
  );
}

function CategoryPicker({ facets, tagEntities, value, busy, onChange, placeholder, className }: {
  facets: TagFacetDefinition[];
  /** Listy, na których tag występuje. Puste = nie zawężamy (nie wiemy). */
  tagEntities: string[];
  value?: string | null;
  busy: boolean;
  onChange: (facetKey: string | null) => void;
  placeholder?: string;
  className?: string;
})
{
  const usable = tagEntities.length === 0
    ? facets
    : facets.filter(facet => tagEntities.some(entity => facet.entities.includes(entity)));

  // Kategoria już przypisana musi zostać na liście, nawet jeśli nie pasuje —
  // inaczej nie dałoby się jej z niej zdjąć.
  const current = value ? facets.find(facet => facet.key === value) : undefined;
  const options = current && !usable.some(facet => facet.key === current.key) ? [current, ...usable] : usable;

  return (
    <Select
      disabled={busy}
      value={value ?? NONE_VALUE}
      onValueChange={next => onChange(next === NONE_VALUE ? null : next)}
    >
      <SelectTrigger className={className ?? 'h-8 w-64 text-sm'}>
        <SelectValue placeholder={placeholder ?? 'przypisz do kategorii…'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>— brak kategorii —</SelectItem>
        {
          options.map(facet => (
            <SelectItem key={facet.key} value={facet.key}>
              {facet.label} <span className="text-muted-foreground">({entityLabels(facet.entities)})</span>
            </SelectItem>
          ))
        }
      </SelectContent>
    </Select>
  );
}

function CategoriesHelp()
{
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-2 px-4 py-3 text-left">
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="font-medium">Co to jest kategoria i jak jej używać?</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 px-4 pb-4 text-sm">
        <div>
          <h3 className="font-medium">Po co to jest</h3>
          <p className="mt-1 text-muted-foreground">
            Tagi w bibliotece opisują kilka niezależnych rzeczy naraz. Manewr może mieć
            <em> ofensywa</em>, <em>nieumarli</em> i <em>fechtunek</em> — to rola, rodzaj istoty i styl,
            trzy różne osie sklejone w jedną płaską listę. Kategoria nazywa taką oś. Dzięki temu zamiast
            wybierać <em>ofensywa</em> i ręcznie wykluczać osiem tagów bestiarnych, wybierasz
            „Rola: ofensywa” + „Rodzaj istoty: — brak —”.
          </p>
        </div>

        <div>
          <h3 className="font-medium">Kategorie niczego nie zmieniają we wpisach</h3>
          <p className="mt-1 text-muted-foreground">
            To warstwa <strong>opisowa</strong> nad tagami. Tagi na Manewrach, Zaklęciach i reszcie
            zostają dokładnie takie, jakie są. Usunięcie kategorii albo przypisania nie dotknie
            żadnego rekordu — najgorsze, co się stanie, to gorsze grupowanie w filtrze.
          </p>
        </div>

        <div>
          <h3 className="font-medium">Jak działa filtrowanie</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li><strong>W jednej kategorii — suma.</strong> „zwierzęta” + „potwory” pokaże jedne i drugie, nie tylko część wspólną.</li>
            <li><strong>Między kategoriami — iloczyn.</strong> „Rola: ofensywa” × „Styl: fechtunek” zawęża podwójnie.</li>
            <li><strong>„— brak —” znaczy „nie ma żadnego tagu z tej osi”.</strong> Na Manewrach „Rodzaj istoty: — brak —” to po prostu manewry wojaka.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium">Aliasy — jedna rzecz pod dwiema nazwami</h3>
          <p className="mt-1 text-muted-foreground">
            Manewr mówi <em>nieumarli</em>, Postać <em>nieumarły</em>. To jedna wartość, więc druga
            pisownia jest aliasem — bez przemianowywania danych. Alias <strong>zawsze wskazuje listy,
            których dotyczy</strong>, bo ten sam napis potrafi znaczyć co innego gdzie indziej:
            <em> natura</em> to zwierzę na Postaci, szkoła magii na Zaklęciu i materiał na Przedmiocie.
          </p>
        </div>

        <div>
          <h3 className="font-medium">Dwie zasady, których pilnuje serwer</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li><strong>Jeden tag należy do jednej kategorii.</strong> Jeśli ten sam napis znaczy dwie różne rzeczy na różnych listach, zawęź <em>listy</em> kategorii albo zostaw go nieprzypisanego.</li>
            <li><strong>Nazwa tagu jest globalnie unikalna.</strong> Nie da się mieć dwóch definicji <em>kusze</em>, nawet dla rozłącznych list — jeśli to naprawdę jedna oś, scal kategorie.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium">„Pozostałe” to nie błąd</h3>
          <p className="mt-1 text-muted-foreground">
            Tag bez kategorii dalej jest widoczny i wyszukiwalny — w filtrze przełącz się na tryb
            „Tagi”. Po prostu się nie grupuje. Część tagów zostaje tam celowo, np. <em>specjalne</em>,
            które jest workiem na wyjątki, a nie osią.
          </p>
        </div>

        <div>
          <h3 className="font-medium">Zakres kategorii — najłatwiejsza pomyłka</h3>
          <p className="mt-1 text-muted-foreground">
            Kategoria obejmuje wybrane <strong>listy</strong>, i tylko na nich cokolwiek robi. Dwie
            kategorie mogą się nazywać tak samo, bo dotyczą czego innego: „Pochodzenie (Wierzchowce)”
            to hodowla, „Pochodzenie (Przedmioty)” to kultura wyrobu. Dlatego listy wyboru pokazują
            zakres w nawiasie i oferują wyłącznie kategorie sięgające tam, gdzie tag naprawdę
            występuje. Gdyby mimo to trafił poza zakres, wyląduje w czerwonej sekcji
            „Przypisania bez efektu” — bo takie przypisanie wygląda na zrobione, a nie działa.
          </p>
        </div>

        <div>
          <h3 className="font-medium">Typowa praca</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Zerknij na „Rozjazd kategorii” — tag z dużą liczbą wystąpień zwykle należy do jakiejś osi.</li>
            <li>Przypisz go listą wyboru obok. Jeśli żadna kategoria nie pasuje, utwórz nową.</li>
            <li>Sprawdź w filtrze, czy pojawił się tam, gdzie miał.</li>
            <li>Pomyliłeś kategorię? Rozwiń „Tagi (N)” na karcie i przestaw listą wyboru przy tagu — albo „Usuń definicję”, żeby wrócił do „Pozostałych”.</li>
            <li>Zła nazwa, opis albo zakres kategorii? „Edytuj” na karcie; zabranie listy pokaże wcześniej, ile tagów przestanie się na niej filtrować.</li>
          </ol>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AddFacetForm({ busy, onSave }: { busy: boolean; onSave: SaveFn })
{
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [entities, setEntities] = useState<string[]>([]);
  const [single, setSingle] = useState(false);
  const [supportsNone, setSupportsNone] = useState(true);

  const submit = async () =>
  {
    const saved = await onSave({
      resource: 'facet',
      action: 'upsert',
      key: key.trim(),
      label: label.trim() || key.trim(),
      // Na koniec listy — kolejność zmienia się potem, a zgadywanie miejsca
      // przy tworzeniu tylko przestawiałoby istniejące kategorie.
      order: 99,
      selectionMode: single ? 'single' : 'multi',
      supportsNone,
      entities,
    });

    if (!saved) return;
    setKey(''); setLabel(''); setEntities([]); setSingle(false); setSupportsNone(true); setOpen(false);
  };

  if (!open)
  {
    return (
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
        Dodaj kategorię
      </Button>
    );
  }

  return (
    <section className="rounded-lg border border-dashed p-4">
      <h2 className="text-lg font-semibold">Nowa kategoria</h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input value={key} onChange={e => setKey(e.target.value)} placeholder="klucz (np. szkoła-magii)" className="h-8 w-56 text-sm" />
        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="nazwa widoczna" className="h-8 w-56 text-sm" />
      </div>

      <p className="mt-3 text-xs font-medium">Których list dotyczy:</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {
          ENTITY_OPTIONS.map(entity => (
            <label key={entity} className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={entities.includes(entity)}
                onCheckedChange={() => setEntities(current =>
                  current.includes(entity) ? current.filter(item => item !== entity) : [...current, entity])}
              />
              {entityLabel(entity)}
            </label>
          ))
        }
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5">
          <Checkbox checked={single} onCheckedChange={() => setSingle(!single)} />
          tylko jedna wartość naraz
        </label>
        <label className="flex items-center gap-1.5">
          <Checkbox checked={supportsNone} onCheckedChange={() => setSupportsNone(!supportsNone)} />
          oferuj „— brak —&quot;
        </label>
      </div>

      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" disabled={busy || !key.trim() || entities.length === 0} onClick={() => void submit()}>
          Utwórz
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Anuluj</Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Sama kategoria niczego nie zmienia — dopóki nie przypiszesz do niej tagów, jest niewidoczna w filtrze.
      </p>
    </section>
  );
}

function AssignmentChip({ definition, facets, tagEntities, busy, onSave }: {
  definition: TagDefinitionRecord;
  facets: TagFacetDefinition[];
  tagEntities: string[];
  busy: boolean;
  onSave: SaveFn;
})
{
  return (
    <span className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
      {definition.tag}
      <CategoryPicker
        facets={facets}
        tagEntities={tagEntities}
        value={definition.facetKey}
        busy={busy}
        className="h-7 w-56 text-xs"
        onChange={facetKey => void onSave({
          resource: 'definition',
          action: 'upsert',
          tag: definition.tag,
          facetKey,
          label: definition.label ?? null,
          order: definition.order ?? null,
          aliases: definition.aliases ?? [],
        })}
      />
    </span>
  );
}

function FacetCard({ facet, definitions, allFacets, tagEntities, busy, onSave }: {
  facet: TagFacetDefinition;
  definitions: TagDefinitionRecord[];
  allFacets: TagFacetDefinition[];
  tagEntities: Record<string, string[]>;
  busy: boolean;
  onSave: SaveFn;
})
{
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Pusta kategoria to najczęściej pozostałość po scaleniu albo po przeniesieniu
  // tagów gdzie indziej — seed robi wyłącznie `upsert`, więc sam jej nie sprząta.
  // W filtrze i tak jest niewidoczna (kategorie bez wartości są odrzucane), ale
  // bez tego przycisku nie dało się jej usunąć inaczej niż przez API.
  const isEmpty = definitions.length === 0;

  const remove = () => void onSave({ resource: 'facet', action: 'delete', key: facet.key });

  return (
    <section className={`rounded-lg border p-4 ${isEmpty ? 'border-dashed opacity-70' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">
            {facet.label} <span className="text-sm font-normal text-muted-foreground">{facet.key}</span>
            {isEmpty && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal">pusta</span>}
          </h2>
          <p className="text-xs text-muted-foreground">
            {facet.selectionMode === 'single' ? 'jedna wartość' : 'wiele wartości'} ·
            {facet.supportsNone ? ' z „— brak —"' : ' bez „— brak —"'} ·
            kolejność {facet.order} · encje: {entityLabels(facet.entities)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Zamknij edycję' : 'Edytuj'}
          </Button>

          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Zwiń' : `Tagi (${definitions.length})`}
          </Button>

          {
            confirmingDelete
              ? (
                <>
                  <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={remove}>
                    Potwierdź usunięcie
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Anuluj
                  </Button>
                </>
              )
              : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(true)}
                >
                  Usuń kategorię
                </Button>
              )
          }
        </div>
      </div>

      {
        confirmingDelete && (
          <p className="mt-2 rounded bg-muted px-3 py-2 text-sm">
            {
              isEmpty
                ? 'Kategoria jest pusta — usunięcie nie zmieni żadnego wpisu.'
                : `${definitions.length} tag(ów) wróci do „Pozostałych". Żaden rekord encji nie zostanie zmieniony — to warstwa opisowa.`
            }
          </p>
        )
      }

      {facet.description && !editing && <p className="mt-2 text-sm text-muted-foreground">{facet.description}</p>}

      {editing && <FacetEditForm facet={facet} definitions={definitions} busy={busy} onSave={onSave} onDone={() => setEditing(false)} />}

      {
        expanded && (
          <div className="mt-3 space-y-2">
            {definitions.map(definition => (
              <DefinitionRow
                key={definition.tag}
                definition={definition}
                facets={allFacets}
                tagEntities={tagEntities[definition.tag] ?? []}
                busy={busy}
                onSave={onSave}
              />
            ))}
          </div>
        )
      }
    </section>
  );
}

/**
 * Edycja kategorii (Fala 10.8 B).
 *
 * Jedyne pole, którego nie da się tu zmienić, to `key` — to on wiąże definicje
 * tagów z kategorią, więc jego podmiana rozjechałaby przypisania. Zwężenie
 * `entities` jest za to odwracalne, ale nie darmowe: tagi żyjące poza nowym
 * zakresem przestaną się filtrować, więc liczymy je i pokazujemy przed zapisem.
 */
function FacetEditForm({ facet, definitions, busy, onSave, onDone }: {
  facet: TagFacetDefinition;
  definitions: TagDefinitionRecord[];
  busy: boolean;
  onSave: SaveFn;
  onDone: () => void;
})
{
  const [label, setLabel] = useState(facet.label);
  const [description, setDescription] = useState(facet.description ?? '');
  const [order, setOrder] = useState(String(facet.order));
  const [orderError, setOrderError] = useState('');
  const [entities, setEntities] = useState<string[]>([...facet.entities]);
  const [selectionMode, setSelectionMode] = useState(facet.selectionMode);
  const [supportsNone, setSupportsNone] = useState(facet.supportsNone);

  const dropped = facet.entities.filter(entity => !entities.includes(entity));

  const submit = async () =>
  {
    if (order.trim() === '') {
      setOrderError('Uzupełnij pole');
      return;
    }
    const parsed = Number(order);
    if (!Number.isInteger(parsed)) {
      setOrderError('Wpisz liczbę całkowitą');
      return;
    }
    setOrderError('');

    const saved = await onSave({
      resource: 'facet',
      action: 'upsert',
      key: facet.key,
      label: label.trim() || facet.label,
      description: description.trim() || null,
      order: parsed,
      selectionMode,
      supportsNone,
      entities,
    });

    if (saved) onDone();
  };

  return (
    <div className="mt-3 space-y-3 rounded border border-dashed p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={label} onChange={event => setLabel(event.target.value)} placeholder="nazwa" className="h-8 w-56 text-sm" />
        <Input numeric value={order} onChange={event => { setOrder(event.target.value); setOrderError(''); }}
          aria-invalid={Boolean(orderError)} placeholder="kolejność" className="h-8 w-24 text-sm" />
        {orderError && <p role="alert" className="text-sm text-destructive">{orderError}</p>}

        <Select value={selectionMode} onValueChange={value => setSelectionMode(value as TagFacetDefinition['selectionMode'])}>
          <SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="multi">wiele wartości</SelectItem>
            <SelectItem value="single">jedna wartość</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-sm">
          <Checkbox checked={supportsNone} onCheckedChange={() => setSupportsNone(!supportsNone)} />
          pokaż „— brak —&quot;
        </label>
      </div>

      <Input
        value={description}
        onChange={event => setDescription(event.target.value)}
        placeholder="opis — widoczny w filtrze pod nazwą kategorii"
        className="h-8 text-sm"
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Listy:</span>
        {
          ENTITY_OPTIONS.map(entity => (
            <label key={entity} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={entities.includes(entity)}
                onCheckedChange={() => setEntities(current =>
                  current.includes(entity) ? current.filter(item => item !== entity) : [...current, entity])}
              />
              {entityLabel(entity)}
            </label>
          ))
        }
      </div>

      {
        dropped.length > 0 && (
          <p className="rounded bg-muted px-3 py-2 text-sm">
            Zabierasz: {entityLabels(dropped)}. {definitions.length} tag(ów) tej kategorii przestanie się filtrować na tych listach —
            same wpisy pozostają nietknięte.
          </p>
        )
      }

      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={busy || entities.length === 0} onClick={() => void submit()}>Zapisz</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Anuluj</Button>
      </div>
    </div>
  );
}

function DefinitionRow({ definition, facets, tagEntities, busy, onSave }: {
  definition: TagDefinitionRecord;
  facets: TagFacetDefinition[];
  tagEntities: string[];
  busy: boolean;
  onSave: SaveFn;
})
{
  const [alias, setAlias] = useState('');
  const [aliasEntities, setAliasEntities] = useState<string[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const facet = facets.find(candidate => candidate.key === definition.facetKey);
  // Offering entities outside the facet would only let an admin create a dead
  // alias — the server rejects it anyway, so it is not offered in the first place.
  const selectableEntities = facet?.entities ?? ENTITY_OPTIONS;

  const addAlias = async () =>
  {
    if (!alias.trim() || aliasEntities.length === 0) return;

    const saved = await onSave({
      resource: 'definition',
      action: 'upsert',
      tag: definition.tag,
      facetKey: definition.facetKey ?? null,
      label: definition.label ?? null,
      order: definition.order ?? null,
      aliases: [...(definition.aliases ?? []), { alias: alias.trim(), entities: aliasEntities }],
    });

    if (saved) { setAlias(''); setAliasEntities([]); }
  };

  const removeAlias = (target: string) => void onSave({
    resource: 'definition',
    action: 'upsert',
    tag: definition.tag,
    facetKey: definition.facetKey ?? null,
    label: definition.label ?? null,
    order: definition.order ?? null,
    aliases: (definition.aliases ?? []).filter(entry => entry.alias !== target),
  });

  return (
    <div className="rounded border p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{definition.tag}</span>

        {/* Fala 10.8 A: bez tego pomyłkowe przypisanie było nieodwracalne z UI —
            wiersz pokazywał tylko aliasy, a kategoria była do zmiany wyłącznie
            wtedy, gdy tag akurat leżał w „Tagach bez kategorii". */}
        <CategoryPicker
          facets={facets}
          tagEntities={tagEntities}
          value={definition.facetKey}
          busy={busy}
          className="h-7 w-56 text-xs"
          onChange={facetKey => void onSave({
            resource: 'definition',
            action: 'upsert',
            tag: definition.tag,
            facetKey,
            label: definition.label ?? null,
            order: definition.order ?? null,
            aliases: definition.aliases ?? [],
          })}
        />

        {
          confirmingDelete
            ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  disabled={busy}
                  onClick={() => void onSave({ resource: 'definition', action: 'delete', tag: definition.tag })}
                >
                  Usuń wraz z aliasami
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmingDelete(false)}>
                  Anuluj
                </Button>
              </>
            )
            : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                disabled={busy}
                onClick={() => setConfirmingDelete(true)}
                title={'Kasuje definicję i jej aliasy. Tag zostaje na wpisach i wraca do „Pozostałych”.'}
              >
                Usuń definicję
              </Button>
            )
        }

        {
          (definition.aliases ?? []).map(entry => (
            <button
              key={entry.alias}
              type="button"
              className="rounded bg-muted px-2 py-0.5 text-xs hover:line-through"
              onClick={() => removeAlias(entry.alias)}
              title="Usuń alias"
            >
              {entry.alias} <span className="text-muted-foreground">({entityLabels(entry.entities)})</span>
            </button>
          ))
        }

        {
          (definition.formerNames ?? []).length > 0 && (
            <span className="text-xs text-muted-foreground">
              dawniej: {(definition.formerNames ?? []).join(', ')}
            </span>
          )
        }
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          value={alias}
          onChange={event => setAlias(event.target.value)}
          placeholder="nowy alias"
          className="h-7 w-40 text-xs"
        />

        {
          selectableEntities.map(entity => (
            <label key={entity} className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={aliasEntities.includes(entity)}
                onCheckedChange={() => setAliasEntities(current =>
                  current.includes(entity) ? current.filter(item => item !== entity) : [...current, entity])}
              />
              {entityLabel(entity)}
            </label>
          ))
        }

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={busy || !alias.trim() || aliasEntities.length === 0}
          onClick={() => void addAlias()}
        >
          Dodaj alias
        </Button>
      </div>
    </div>
  );
}
