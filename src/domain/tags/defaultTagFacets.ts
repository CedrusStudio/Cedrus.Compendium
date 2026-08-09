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
    key: "źródło-mocy",
    label: "Źródło mocy",
    // Lista Mocy w kompendium JEST słownikiem tej osi: Ogień, Zimno, Altoria,
    // Błyskawice, Kinetyka, Aramantia, Czarna Magia, Nekromancja, Vortex…
    // Dlatego nie ma osobnej osi „żywioł" — `ogień` jest Mocą dokładnie tak samo
    // jak `nekromancja` (decyzja Marka). Dane to potwierdzają: żaden „żywioł"
    // nigdy nie występuje z innym, a ze „szkołą" tylko 6 razy na 421 zaklęć.
    description: "Skąd bierze się magia. 145 z 421 zaklęć nie ma żadnego źródła — dla nich użyj „— brak —”.",
    order: 4,
    selectionMode: "multi",
    supportsNone: true,
    // Postaci tu NIE MA celowo — patrz komentarz przy `natura` niżej.
    entities: ["spells", "perks", "powerSpecifications"],
  },
  {
    key: "sposób-działania",
    label: "Sposób działania",
    description: "Jak zaklęcie działa, niezależnie od tego skąd czerpie moc.",
    order: 5,
    selectionMode: "multi",
    supportsNone: true,
    // Moce są tu wyłącznie po to, żeby alias `rozproszenie` nie był martwy —
    // `TagAlias.entities` musi być podzbiorem encji kategorii.
    entities: ["spells", "perks", "powerSpecifications"],
  },
  {
    key: "styl",
    label: "Styl",
    description: "Szkoła walki. `widmowy` jest stylem gracza, mimo że często towarzyszy nieumarłym.",
    order: 6,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "stances", "perks"],
  },
  {
    key: "oreż",
    label: "Oręż",
    // Scalone z dawnym `rodzaj-broni`: `kusze` i `łuki` znaczą to samo po obu
    // stronach („manewr z kuszy" i „ta broń jest kuszą"), a jeden tag może mieć
    // tylko jedną definicję. To jedna oś — czym się walczy — więc obejmuje też
    // Bronie. Każda encja i tak widzi wyłącznie wartości, które naprawdę ma,
    // bo `buildTagFacetIndex` filtruje po `availableTags`.
    description: "Czym się walczy — po stronie zdolności i po stronie samej broni.",
    order: 7,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "perks", "weapons"],
  },
  {
    key: "cecha",
    label: "Cecha",
    description: "Na czym zdolność się opiera.",
    order: 8,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "perks"],
  },
  {
    key: "forma",
    label: "Forma",
    description: "Sposób użycia: okrzyk, rozkaz, działanie obszarowe.",
    order: 9,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["maneuvers", "perks"],
  },
  {
    key: "klasa-zbroi",
    label: "Klasa zbroi",
    description: "Jedyny naprawdę rozłączny facet w bibliotece — zbroja ma dokładnie jedną wagę.",
    order: 10,
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
    order: 11,
    selectionMode: "multi",
    supportsNone: false,
    entities: ["weapons", "armors", "shields"],
  },
  {
    key: "slot",
    label: "Miejsce noszenia",
    description: "Gdzie przedmiot się zakłada.",
    order: 12,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["inventory"],
  },
  {
    key: "pochodzenie-wierzchowca",
    label: "Pochodzenie",
    description: "Skąd wierzchowiec pochodzi — rasa/hodowla, nie kultura.",
    order: 13,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["mounts"],
  },
  {
    // Osobna oś od `pochodzenie-wierzchowca`, mimo tej samej etykiety. `durski`
    // to hodowla wierzchowca, `krasnoludy` to wyrób kulturowy — zlanie ich
    // w jedno wstawiłoby `durski` do filtra Przedmiotów. Dwa rekordy to mało,
    // ale to jedyna oś, na której `krasnoludy` cokolwiek znaczą (decyzja Marka).
    key: "pochodzenie-przedmiotu",
    label: "Pochodzenie",
    description: "Kultura, z której przedmiot pochodzi.",
    order: 14,
    selectionMode: "multi",
    supportsNone: true,
    entities: ["inventory"],
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
    // `natura` znaczy zwierzę na Postaci i na Rasie (Szaszynszyn, Szczuroszczerk);
    // na Zaklęciu i Atucie to szkoła magii (107 rekordów), na Przedmiocie
    // naturalny materiał (14 — skorupa, chityna, pióra). Stąd zawężenie.
    aliases: [{ alias: "natura", entities: ["characters", "races"] }],
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
  // Rodzaje broni — ta sama oś, tylko po stronie przedmiotu. `kusze` i `łuki`
  // celowo nie powtórzone: są wyżej i obsługują obie encje naraz.
  ...list("oreż", [
    "miecze", "obuchowe", "kłute", "sieczne", "miażdżące", "drzewcowe", "topory", "puginały",
    "łańcuchowe", "szermiercze", "naręczne", "obusieczne", "krótkie", "dystansowe", "miotane",
    "wręcz", "rolnicze",
  ]).map((definition, index) => ({ ...definition, order: 20 + index })),

  // --- cecha -----------------------------------------------------------
  ...list("cecha", ["siła", "zręczność", "umysł", "wytrwałość", "krytyk", "dystans", "inicjatywa", "refleks", "zdrowie"]),

  // --- forma -----------------------------------------------------------
  { tag: "okrzyki-bojowe", facetKey: "forma", order: 1, aliases: [], formerNames: ["okrzyki"] },
  ...list("forma", ["rozkazy", "masowe", "postawy", "jeździectwo"])
    .map((definition, index) => ({ ...definition, order: 2 + index })),

  // --- źródło-mocy -----------------------------------------------------
  // ⚠️ `natura` jest tu KANONICZNA (magia natury: Vortex, Drążenie, Rozkład,
  // Błogosławieństwo Natury), a jednocześnie aliasem `zwierzęta` na Postaciach
  // (Wilk, Lew, Krokodyl). To ten sam napis w dwóch znaczeniach — jak `rdzeń`.
  // Rozwiązane przez ZAKRES FACETU: `źródło-mocy` nie obejmuje Postaci, więc te
  // 25 zwierząt nie może wpaść pod magię natury. Kosztem jest to, że magiczne
  // tagi Postaci (nekromancja, ogień, zimno, błyskawice, altoria, kinetyka —
  // po 6) zostają w „Pozostałych". Świadomy kompromis, zero zmian w danych.
  { tag: "natura", facetKey: "źródło-mocy", order: 1, aliases: [], formerNames: [] },
  ...list("źródło-mocy", [
    "nekromancja", "szamaństwo", "altoria", "esencja", "kinetyka", "promieniowanie",
    "ogień", "zimno", "błyskawice", "światło", "czarna-magia", "aramantia", "boska",
    "egzystencjonalne", "życiowe",
  ]).map((definition, index) => ({ ...definition, order: 2 + index })),
  // Podgatunki natury: KAŻDE zaklęcie z tymi tagami niesie też `natura`
  // (vortex 14/14, grzybowe 4/4, drążenie 4/4, liściaste 1/1). Przy semantyce OR
  // hierarchii nie trzeba modelować — wybór `natura` i tak je obejmuje, a wybór
  // podgatunku zawęża.
  ...list("źródło-mocy", ["vortex", "drążenie", "rozkład", "grzybowe", "liściaste"])
    .map((definition, index) => ({ ...definition, order: 20 + index })),
  // Marek: `moc` znaczy „dotyczy magii" — ogólny znacznik, nie konkretne źródło.
  // Największy nieprzypisany tag w bibliotece (106 Atutów).
  { tag: "moc", facetKey: "źródło-mocy", label: "ogólna (dotyczy magii)", order: 30, aliases: [], formerNames: [] },
  { tag: "wiara", facetKey: "źródło-mocy", order: 31, aliases: [], formerNames: [] },

  // --- sposób-działania ------------------------------------------------
  // `zdrowie` NIE trafia tutaj: na Atutach (28) jest już w „Cecha", a jeden tag
  // może należeć tylko do jednej kategorii. Trzy lecznicze zaklęcia zostają
  // w „Pozostałych" — nie warto dla nich dublować osi.
  ...list("sposób-działania", ["obszar", "wielorundowe", "ochronne", "precyzja"]),
  // Moc nazywa się „Rozproszenie", Zaklęcia mówią `rozpraszanie` — ta sama rzecz,
  // dwie pisownie, różne encje. Dokładnie po to są aliasy: zero zmian w danych.
  {
    tag: "rozpraszanie", facetKey: "sposób-działania", order: 5, formerNames: [],
    aliases: [{ alias: "rozproszenie", entities: ["powerSpecifications"] }],
  },

  // --- slot / pochodzenie wierzchowca ----------------------------------
  // `natura` na Przedmiotach (14) to naturalny MATERIAŁ — trzecie znaczenie tego
  // napisu. Zostaje nieprzypisane, bo `natura` jest już kanoniczna w źródle mocy.
  ...list("slot", ["hełmy", "karwasze", "peleryny", "buty", "pierścienie"]),
  // `durski` NIE trafia tutaj — to styl walki (Manewry 8), już zajęty przez „Styl".
  // Jeden wierzchowiec traci grupowanie; nie warto dla niego przemianowywać stylu.
  ...list("pochodzenie-wierzchowca", ["lantrewia", "girgen", "anareja"]),


  // --- klasa-zbroi -----------------------------------------------------
  ...list("klasa-zbroi", ["lekkie", "średnie", "ciężkie", "szata"]),

  // --- jakość ----------------------------------------------------------
  { tag: "magiczne", facetKey: "jakość", order: 1, aliases: [], formerNames: [] },
  { tag: "legendarne", facetKey: "jakość", order: 2, aliases: [], formerNames: [] },
  { tag: "mistrzowskie", facetKey: "jakość", order: 3, aliases: [], formerNames: ["mistrzowski"] },

  // --- pochodzenie-przedmiotu -------------------------------------------
  // Wpis pełni też rolę sprzątającą: `krasnoludy` trafiły ręcznie do
  // `pochodzenie-wierzchowca` (kategoria bez Przedmiotów, więc przypisanie nic
  // nie robiło). Seed upsertuje po `tag`, więc ponowne uruchomienie to naprawia.
  plain("krasnoludy", "pochodzenie-przedmiotu", 1),
];
