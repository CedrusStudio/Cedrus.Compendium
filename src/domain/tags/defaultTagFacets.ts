/**
 * The facet layout Marek approved on 2026-08-07 (Wave 10.1).
 *
 * Seed data, not a source of truth: once written to `TagFacet` /
 * `TagDefinition` the admin panel owns it. Kept in code so the seed script and
 * the tests reason about the same table, and so the reasoning behind each
 * grouping stays next to the grouping.
 *
 * Counts in the comments come from `backup/2026-08-04T06-49-21-923Z`, BEFORE the
 * 9.0 rename. Anything not listed here stays unassigned on purpose — an
 * unassigned tag is visible in the "Pozostałe" bucket, a wrongly assigned one is
 * a silently wrong search result.
 */

import type { TagDefinitionRecord, TagFacetDefinition } from "@/domain/tags/tagFacets";

export const DEFAULT_TAG_FACETS: readonly TagFacetDefinition[] = [
  {
    key: "rola",
    label: "Rola",
    description: "Czy wpis atakuje, czy broni. Nie jest rozłączny — manewr może dawać naraz obrażenia i redukcję.",
    order: 1,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "stances", "states", "spells", "perks"],
  },
  {
    key: "rodzaj-istoty",
    label: "Rodzaj istoty",
    description: "Czyja to zdolność (Manewry, Atuty) albo czym jest istota (Postacie, Rasy). Jedna oś, dwie pisownie.",
    order: 2,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "perks", "characters", "races"],
  },
  {
    key: "rola-postaci",
    label: "Rola postaci",
    description: "Wyszkolenie zamiast gatunku. Istniało w danych od zawsze, nigdy nie było w filtrze.",
    order: 3,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["characters"],
  },
  {
    key: "styl",
    label: "Styl",
    description: "Szkoła walki. `widmowy` jest stylem gracza, mimo że często towarzyszy nieumarłym.",
    order: 4,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "stances", "perks"],
  },
  {
    key: "oreż",
    label: "Oręż",
    description: "Czym się walczy, po stronie zdolności (nie: czym jest przedmiot).",
    order: 5,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "perks"],
  },
  {
    key: "cecha",
    label: "Cecha",
    description: "Na czym zdolność się opiera.",
    order: 6,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "perks"],
  },
  {
    key: "forma",
    label: "Forma",
    description: "Sposób użycia: okrzyk, rozkaz, działanie obszarowe.",
    order: 7,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "perks"],
  },
  {
    key: "rodzaj-broni",
    label: "Rodzaj broni",
    order: 8,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["weapons"],
  },
  {
    key: "klasa-zbroi",
    label: "Klasa zbroi",
    description: "Jedyny naprawdę rozłączny facet w bibliotece — zbroja ma dokładnie jedną wagę.",
    order: 9,
    selectionMode: "single",
    supportsNone: true,
    entities: ["armors"],
  },
  {
    key: "jakość",
    label: "Jakość",
    // `legendarne` NIGDY nie występuje bez `magiczne` (6 z 6 broni, 2 z 2 tarcz),
    // więc facet jednowartościowy by je zjadł. To flagi, nie drabina.
    description: "Flagi, nie drabina. Brak flagi znaczy zwykły sprzęt, a nie brak informacji.",
    order: 10,
    selectionMode: "multi",
    supportsNone: false,
    entities: ["weapons", "armors", "shields"],
  },
];

const plain = (tag: string, facetKey: string, order: number): TagDefinitionRecord =>
  ({ tag, facetKey, order, aliases: [], formerNames: [] });

const list = (facetKey: string, tags: readonly string[]): TagDefinitionRecord[] =>
  tags.map((tag, index) => plain(tag, facetKey, index + 1));

export const DEFAULT_TAG_DEFINITIONS: readonly TagDefinitionRecord[] = [
  // --- rola ------------------------------------------------------------
  // `formerNames` zapisuje, skąd przyszła nazwa po renamie 9.0 — to historia,
  // NIE synonim: gdyby trafiła do `aliases`, stary napis znów zacząłby łapać.
  { tag: "ofensywa", facetKey: "rola", order: 1, aliases: [], formerNames: ["ofensywne"] },
  { tag: "defensywa", facetKey: "rola", order: 2, aliases: [], formerNames: ["defensywne"] },

  // --- rodzaj-istoty ---------------------------------------------------
  // Manewry mówią liczbą mnogą („manewry nieumarłych"), Postacie i Rasy
  // pojedynczą („ta istota jest nieumarłym"). Dwa wyjątki to inne słowa, nie
  // odmiana: `natura` i `dziki`. `potwory` jest identyczne po obu stronach.
  {
    tag: "potwory", facetKey: "rodzaj-istoty", order: 1, formerNames: [],
    aliases: [],
  },
  {
    tag: "zwierzęta", facetKey: "rodzaj-istoty", order: 2, formerNames: [],
    // `natura` znaczy zwierzę TYLKO na Postaci; na Zaklęciu i Atucie to szkoła
    // magii (107 rekordów), na Przedmiocie naturalny materiał. Stąd zawężenie.
    aliases: [{ alias: "natura", entities: ["characters"] }],
  },
  {
    tag: "nieumarli", facetKey: "rodzaj-istoty", order: 3, formerNames: [],
    aliases: [{ alias: "nieumarły", entities: ["characters"] }],
  },
  {
    tag: "eteryczni", facetKey: "rodzaj-istoty", order: 4, formerNames: [],
    aliases: [{ alias: "eteryczny", entities: ["characters"] }],
  },
  {
    tag: "demon", facetKey: "rodzaj-istoty", order: 5, formerNames: [],
    aliases: [{ alias: "demoniczne", entities: ["maneuvers"] }],
  },
  {
    tag: "diabeł", facetKey: "rodzaj-istoty", order: 6, formerNames: [],
    aliases: [{ alias: "diabelskie", entities: ["maneuvers"] }],
  },
  {
    tag: "anioł", facetKey: "rodzaj-istoty", order: 7, formerNames: [], aliases: [],
  },
  {
    tag: "prymitywni", facetKey: "rodzaj-istoty", order: 8, formerNames: [],
    aliases: [{ alias: "dziki", entities: ["characters", "races"] }],
  },
  {
    tag: "wynaturzenia", facetKey: "rodzaj-istoty", order: 9, formerNames: [],
    aliases: [{ alias: "wynaturzenie", entities: ["characters"] }],
  },
  {
    tag: "gadzie", facetKey: "rodzaj-istoty", order: 10, formerNames: [],
    aliases: [{ alias: "gad", entities: ["races"] }],
  },
  ...list("rodzaj-istoty", ["trupojad", "skałożerca", "wodne", "lądowe", "humanoidalne", "podstawowa"])
    .map((definition, index) => ({ ...definition, order: 11 + index })),

  // --- rola-postaci ----------------------------------------------------
  ...list("rola-postaci", ["wojak", "mag", "rycerz", "walczący-wręcz", "zbój", "dystansowy", "jeździec", "łucznik", "kusznik"]),

  // --- styl ------------------------------------------------------------
  { tag: "widmowy", facetKey: "styl", order: 1, aliases: [], formerNames: ["widmowe"] },
  ...list("styl", ["fechtunek", "fortel", "harmonia", "rdzeń", "samotny-oręż", "girgeński", "durski", "mord"])
    .map((definition, index) => ({ ...definition, order: 2 + index })),

  // --- oręż ------------------------------------------------------------
  ...list("oreż", ["walka-wręcz", "kusze", "łuki", "dwuręczny", "półtoraręczny", "duale", "tarcze", "włócznie", "sztylet-do-rzutu"]),

  // --- cecha -----------------------------------------------------------
  ...list("cecha", ["siła", "zręczność", "umysł", "wytrwałość", "krytyk", "dystans", "inicjatywa", "refleks", "zdrowie"]),

  // --- forma -----------------------------------------------------------
  { tag: "okrzyki-bojowe", facetKey: "forma", order: 1, aliases: [], formerNames: ["okrzyki"] },
  ...list("forma", ["rozkazy", "masowe", "postawy", "jeździectwo"])
    .map((definition, index) => ({ ...definition, order: 2 + index })),

  // --- rodzaj-broni ----------------------------------------------------
  ...list("rodzaj-broni", [
    "miecze", "obuchowe", "kłute", "sieczne", "miażdżące", "drzewcowe", "topory", "puginały",
    "łańcuchowe", "szermiercze", "naręczne", "obusieczne", "krótkie", "dystansowe", "łuki", "kusze",
    "miotane", "wręcz", "rolnicze",
  ]),

  // --- klasa-zbroi -----------------------------------------------------
  ...list("klasa-zbroi", ["lekkie", "średnie", "ciężkie", "szata"]),

  // --- jakość ----------------------------------------------------------
  { tag: "magiczne", facetKey: "jakość", order: 1, aliases: [], formerNames: [] },
  { tag: "legendarne", facetKey: "jakość", order: 2, aliases: [], formerNames: [] },
  { tag: "mistrzowskie", facetKey: "jakość", order: 3, aliases: [], formerNames: ["mistrzowski"] },
];
