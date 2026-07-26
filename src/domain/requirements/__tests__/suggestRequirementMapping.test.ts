import { describe, expect, it } from "vitest";
import { extractRequirementValue, suggestRequirementMapping, suggestRequirementMappings } from "@/domain/requirements/suggestRequirementMapping";

describe("suggestRequirementMapping", () => {
  describe("extractRequirementValue", () => {
    it("pulls the first integer from the text", () => {
      expect(extractRequirementValue("siła 3")).toBe(3);
      expect(extractRequirementValue("ranga 12 czegoś")).toBe(12);
    });

    it("returns undefined when there is no number", () => {
      expect(extractRequirementValue("zapał wojownika")).toBeUndefined();
    });
  });

  it("maps a Polish characteristic label + number", () => {
    expect(suggestRequirementMapping("Siła 3")).toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 });
  });

  it("maps a Polish attribute label + number", () => {
    expect(suggestRequirementMapping("Fechtunek 2")).toEqual({ kind: "ranked", group: "attributes", targetKey: "fencing", value: 2 });
  });

  it("maps by domain key as well", () => {
    expect(suggestRequirementMapping("strength 4")).toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 4 });
  });

  it("finds a skill word embedded in a longer phrase", () => {
    expect(suggestRequirementMapping("wymaga siła 5")).toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 5 });
  });

  it("maps a known entity name + rank", () => {
    const suggestion = suggestRequirementMapping("Cios Tarczą 2", { maneuvers: ["Cios Tarczą", "Pchnięcie"] });
    expect(suggestion).toEqual({ kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 2 });
  });

  it("defaults a numberless entity match to rank 1", () => {
    const suggestion = suggestRequirementMapping("Zapał Wojownika", { perks: ["Zapał Wojownika"] });
    expect(suggestion).toEqual({ kind: "ranked", group: "perks", targetKey: "Zapał Wojownika", value: 1 });
  });

  it("returns null for free text that matches nothing", () => {
    expect(suggestRequirementMapping("musi umieć pływać")).toBeNull();
  });

  it("returns null for empty text", () => {
    expect(suggestRequirementMapping("   ")).toBeNull();
  });

  it("does not invent an entity match without options", () => {
    expect(suggestRequirementMapping("Cios Tarczą 2")).toBeNull();
  });

  // --- Wave 7.5: the most specific match wins -------------------------------
  //
  // Every case below is a real text from the 2026-07-19 backup. Before the
  // reorder these mapped to a statistic because the entity name happens to
  // contain a stat word — 298 occurrences across 48 distinct texts.
  describe("entity names beat a stat word inside them", () => {
    const library = {
      perks: ["Większy Fechtunek", "Większa Precyzja", "Większy Fortel", "Większa Inicjatywa", "Siła Krytyka", "Szansa Krytyka"],
    };

    it("maps „Większy Fechtunek 5\" to the Atut, not to attributes/fencing", () => {
      expect(suggestRequirementMapping("Większy Fechtunek 5", library))
        .toEqual({ kind: "ranked", group: "perks", targetKey: "Większy Fechtunek", value: 5 });
    });

    it("maps „Siła Krytyka 2\" to the Atut, not to characteristics/strength", () => {
      expect(suggestRequirementMapping("Siła Krytyka 2", library))
        .toEqual({ kind: "ranked", group: "perks", targetKey: "Siła Krytyka", value: 2 });
    });

    it("maps „Większa Precyzja 4\" to the Atut, not to attributes/precision", () => {
      expect(suggestRequirementMapping("Większa Precyzja 4", library))
        .toEqual({ kind: "ranked", group: "perks", targetKey: "Większa Precyzja", value: 4 });
    });

    it("still falls back to the statistic when no entity claims the text", () => {
      expect(suggestRequirementMapping("Większy Fechtunek 5", {}))
        .toEqual({ kind: "ranked", group: "attributes", targetKey: "fencing", value: 5 });
    });

    it("keeps a bare statistic mapping to the statistic", () => {
      expect(suggestRequirementMapping("Siła 3", library))
        .toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 });
    });
  });

  describe("suggestRequirementMappings — ambiguity is reported, not resolved", () => {
    it("refuses to guess when two groups claim the same name", () => {
      // "Akrobatyka" is both a Maneuver in the compendium and a basic Talent.
      const result = suggestRequirementMappings("Akrobatyka 1", { maneuvers: ["Akrobatyka"], perks: ["Akrobatyka"] });

      expect(result.ambiguous).toBe(true);
      expect(result.suggestion).toBeNull();
      expect(result.candidates).toHaveLength(2);
      expect(result.candidates.map((candidate) => candidate.group)).toEqual(["maneuvers", "perks"]);
    });

    it("reports a single match as unambiguous", () => {
      const result = suggestRequirementMappings("Cios Tarczą 2", { maneuvers: ["Cios Tarczą"] });

      expect(result.ambiguous).toBe(false);
      expect(result.suggestion).toEqual({ kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 2 });
      expect(result.candidates).toHaveLength(1);
    });

    it("does not treat a looser tier as competition for a more specific one", () => {
      // The Atut wins outright; `strength` never even gets considered, so this
      // is a clean suggestion rather than a two-way ambiguity.
      const result = suggestRequirementMappings("Siła Krytyka 2", { perks: ["Siła Krytyka"] });

      expect(result.ambiguous).toBe(false);
      expect(result.candidates).toHaveLength(1);
    });

    it("returns an empty result for text that matches nothing", () => {
      expect(suggestRequirementMappings("musi umieć pływać")).toEqual({ suggestion: null, candidates: [], ambiguous: false });
    });
  });

  // --- Wave 7.6 --------------------------------------------------------------
  describe("statistic shorthand", () => {
    it("reads the abbreviations the library actually uses", () => {
      expect(suggestRequirementMapping("s 2")).toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 2 });
      expect(suggestRequirementMapping("Zr 2")).toEqual({ kind: "ranked", group: "characteristics", targetKey: "dexterity", value: 2 });
      expect(suggestRequirementMapping("S 4")).toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 4 });
    });

    it("only fires when the WHOLE text is shorthand + number", () => {
      // "s" inside a longer word or phrase must never drag in `strength`.
      expect(suggestRequirementMapping("sekret 5")).toBeNull();
      expect(suggestRequirementMapping("skarb 2")).toBeNull();
    });

    it("reads „Ck\" and „Ckr\" as czarokrwistość", () => {
      expect(suggestRequirementMapping("Ck 2")).toEqual({ kind: "ranked", group: "characteristics", targetKey: "spellborn", value: 2 });
      expect(suggestRequirementMapping("Ckr 15")).toEqual({ kind: "ranked", group: "characteristics", targetKey: "spellborn", value: 15 });
    });
  });

  describe("derived values", () => {
    it("reads „SZ 6\" as siła zaklęcia (74 occurrences in the library)", () => {
      expect(suggestRequirementMapping("SZ 6")).toEqual({ kind: "ranked", group: "derived", targetKey: "spellStrength", value: 6 });
    });

    it("reads the phrase spelled out, without being hijacked by the word „siła\"", () => {
      expect(suggestRequirementMapping("siła zaklęcia 6"))
        .toEqual({ kind: "ranked", group: "derived", targetKey: "spellStrength", value: 6 });
    });
  });

  describe("synonyms", () => {
    it("maps „ciche poruszanie\" onto the Talent „skradanie\"", () => {
      expect(suggestRequirementMapping("ciche poruszanie 2", { talents: ["skradanie"] }))
        .toEqual({ kind: "ranked", group: "talents", targetKey: "skradanie", value: 2 });
    });

    it("resolves wording that names an entity indirectly", () => {
      // No entity is called "Okazyjny Cios"; Marek confirmed it means the Atut.
      const library = { perks: ["Okazyjny Atak", "Krytyczne Pudło"], states: ["Szarża"] };

      expect(suggestRequirementMapping("okazyjny cios 1", library))
        .toEqual({ kind: "ranked", group: "perks", targetKey: "Okazyjny Atak", value: 1 });
      expect(suggestRequirementMapping("możliwość krytycznego pudła", library))
        .toEqual({ kind: "ranked", group: "perks", targetKey: "Krytyczne Pudło", value: 1 });
      expect(suggestRequirementMapping("tylko w szarży", library))
        .toEqual({ kind: "ranked", group: "states", targetKey: "Szarża", value: 1 });
    });
  });

  describe("weapon dice as derived values", () => {
    it("reads the minimum weapon die rank", () => {
      expect(suggestRequirementMapping("minimalna ranga kości broni to 5"))
        .toEqual({ kind: "ranked", group: "derived", targetKey: "weaponDiceGrade", value: 5 });
    });

    it("reads the phantom damage die as a yes/no", () => {
      expect(suggestRequirementMapping("co najmniej jedna widmowa kość obrażeń"))
        .toEqual({ kind: "ranked", group: "derived", targetKey: "phantomDamage", value: 1 });
    });
  });

  describe("negations stay free text on purpose", () => {
    it("never turns „brak X\" into a requirement for X", () => {
      // Marek chose not to add a NOT operator for three occurrences — a badly
      // built negation silently inverts the meaning of a requirement.
      expect(suggestRequirementMapping("brak gardy fechmistrza", { maneuvers: ["Garda Fechmistrza"] })).toBeNull();
      expect(suggestRequirementMapping("brak tajnej gardy", { maneuvers: ["Tajna Garda"] })).toBeNull();
    });
  });

  describe("Moc / Więź", () => {
    it("turns a bare „moc\" into an alternative — either source of magic qualifies", () => {
      expect(suggestRequirementMapping("moc 2")).toEqual({
        kind: "anyOf",
        options: [
          { kind: "ranked", group: "powers", targetKey: "moc", value: 2 },
          { kind: "ranked", group: "powers", targetKey: "wiez", value: 2 },
        ],
      });
    });

    it("keeps an explicit source as a single ranked requirement", () => {
      expect(suggestRequirementMapping("więź 3")).toEqual({ kind: "ranked", group: "powers", targetKey: "wiez", value: 3 });
    });

    it("understands the aliases normalizePowerType knows", () => {
      expect(suggestRequirementMapping("arkana 2")).toEqual({ kind: "ranked", group: "powers", targetKey: "wiez", value: 2 });
      expect(suggestRequirementMapping("wiara 1")).toEqual({ kind: "ranked", group: "powers", targetKey: "wiez", value: 1 });
    });
  });

  // --- Wave 8 ----------------------------------------------------------------
  describe("count phrases", () => {
    it("reads a plain „ilość postaw 4\"", () => {
      expect(suggestRequirementMapping("ilość postaw 4")).toEqual({ kind: "count", groups: ["stances"], value: 4 });
    });

    it("separates the quantity from a rank qualifier", () => {
      // "pięć … na poziomie co najmniej 2" used to come out as "at least 2",
      // because the digit belonging to the rank was read as the count.
      expect(suggestRequirementMapping("pięć atutów ofensywnych na poziomie co najmniej 2"))
        .toEqual({ kind: "count", groups: ["perks"], tag: "ofensywa", minGrade: 2, value: 5 });
    });

    it("reads „postawa na randze 3\" as one stance at rank 3, not three stances", () => {
      expect(suggestRequirementMapping("postawa na randze 3"))
        .toEqual({ kind: "count", groups: ["stances"], minGrade: 3, value: 1 });
    });

    it("reads the rank written before the noun — „okrzyk 3 poziomu\"", () => {
      // The rank itself is the cue here: no „ilość"/„liczba" appears, but a
      // rank qualifier means the number is a level, not a quantity.
      expect(suggestRequirementMapping("okrzyk 3 poziomu"))
        .toEqual({ kind: "count", groups: ["maneuvers"], tag: "okrzyki-bojowe", minGrade: 3, value: 1 });
    });

    it("reads a spelled-out number plus a tag adjective", () => {
      expect(suggestRequirementMapping("dwa widmowe manewry"))
        .toEqual({ kind: "count", groups: ["maneuvers"], tag: "widmowy", value: 2 });
    });

    it("spans two groups — „ilość postaw i manewrów 3\"", () => {
      // Group order follows the declaration list, not the sentence — it carries
      // no meaning for a count and staying declarative keeps it predictable.
      expect(suggestRequirementMapping("ilość postaw i manewrów 3"))
        .toEqual({ kind: "count", groups: ["maneuvers", "stances"], value: 3 });
    });

    it("infers the group from the tag when none is named — „ilość okrzyków 2\"", () => {
      // `okrzyki-bojowe` only ever appears on maneuvers, so the tag implies the group.
      expect(suggestRequirementMapping("ilość okrzyków 2"))
        .toEqual({ kind: "count", groups: ["maneuvers"], tag: "okrzyki-bojowe", value: 2 });
    });

    it("needs both a group and a number", () => {
      expect(suggestRequirementMapping("dużo manewrów")).toBeNull();
    });

    it("does not turn an entity NAME containing a tag word into a count", () => {
      // "Cios Tarczą 2" is a maneuver at rank 2. Inferring the group from the
      // „tarcz" tag alone read it as "two shield maneuvers", so the tag-implied
      // group now requires an explicit „ilość"/„liczba" cue.
      expect(suggestRequirementMapping("Cios Tarczą 2")).toBeNull();
      expect(suggestRequirementMapping("Cios Tarczą 2", { maneuvers: ["Cios Tarczą"] }))
        .toEqual({ kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 2 });
    });
  });

  describe("negated texts never produce a positive requirement", () => {
    it("refuses „cecha inna niż czarokrwistość\"", () => {
      // This was suggested as `characteristics/spellborn ≥ 1` — the opposite of
      // what the text says.
      expect(suggestRequirementMapping("cecha inna niż czarokrwistość")).toBeNull();
    });

    it("refuses „brak tajnej gardy\" and „walka bronią inną niż kopia\"", () => {
      expect(suggestRequirementMapping("brak tajnej gardy")).toBeNull();
      expect(suggestRequirementMapping("walka bronią inną niż kopia")).toBeNull();
    });
  });

  describe("two-weapon fighting style", () => {
    it("reads „dwa miecze\" as the style, not as two swords", () => {
      expect(suggestRequirementMapping("dwa miecze"))
        .toEqual({ kind: "ranked", group: "derived", targetKey: "dualWield", value: 1 });
    });

    it("reads „wymagana broń w obu rękach\" the same way", () => {
      expect(suggestRequirementMapping("wymagana broń w obu rękach"))
        .toEqual({ kind: "ranked", group: "derived", targetKey: "dualWield", value: 1 });
    });
  });

  describe("equipment phrases", () => {
    it("reads each armour weight as its own exact category", () => {
      // Marek: „lekka zbroja" means light armour specifically — heavy does not
      // satisfy it — so weights are categories, not a threshold scale.
      expect(suggestRequirementMapping("lekka zbroja")).toEqual({ kind: "ranked", group: "equipment", targetKey: "armor.lekka", value: 1 });
      expect(suggestRequirementMapping("ciężka zbroja")).toEqual({ kind: "ranked", group: "equipment", targetKey: "armor.ciężka", value: 1 });
    });

    it("reads „co najmniej średnia tarcza\" as shield tier 3", () => {
      expect(suggestRequirementMapping("co najmniej średnia tarcza"))
        .toEqual({ kind: "ranked", group: "equipment", targetKey: "shield", value: 3 });
    });

    it("reads a plain weapon category", () => {
      expect(suggestRequirementMapping("miecz")).toEqual({ kind: "ranked", group: "equipment", targetKey: "weapon.miecze", value: 1 });
    });

    it("reads weapon kinds the library names but does not tag", () => {
      // "Kopia" is tagged kłute+drzewcowe like other polearms, and the two
      // „Szpony" weapons only share the generic `naręczne` tag — neither can be
      // isolated by tag, so both are matched by name.
      expect(suggestRequirementMapping("kopia")).toEqual({ kind: "ranked", group: "equipment", targetKey: "weapon.kopia", value: 1 });
      expect(suggestRequirementMapping("szpony")).toEqual({ kind: "ranked", group: "equipment", targetKey: "weapon.szpony", value: 1 });
    });

    it("treats „lub podobna broń\" as GM latitude, not a second target", () => {
      expect(suggestRequirementMapping("miecz lub podobna broń"))
        .toEqual({ kind: "ranked", group: "equipment", targetKey: "weapon.miecze", value: 1 });
    });
  });

  describe("a conjunction of two clauses is never reduced to one of them", () => {
    it("refuses „dwa manewry na inicjatywę i dwa manewry na fechtunek\"", () => {
      // The loose word match used to grab „fechtunek" and assert
      // `attributes/fencing ≥ 1`, silently dropping the whole first half.
      expect(suggestRequirementMapping("dwa manewry na inicjatywę i dwa manwery na fechtunek")).toBeNull();
      expect(suggestRequirementMapping("ilość okrzyków 2 i okrzyk 3 poziomu")).toBeNull();
    });

    it("still reads one requirement that spans two groups", () => {
      // One quantity, one requirement — the „i" joins group nouns, not clauses.
      expect(suggestRequirementMapping("ilość postaw i manewrów fizycznych 3"))
        .toEqual({ kind: "count", groups: ["maneuvers", "stances"], value: 3 });
    });
  });

  describe("sum written with a plus", () => {
    it("reads „Umysł+Zręczność 3\"", () => {
      expect(suggestRequirementMapping("Umysł+Zręczność 3")).toEqual({
        kind: "sum",
        targets: [
          { group: "characteristics", targetKey: "mind" },
          { group: "characteristics", targetKey: "dexterity" },
        ],
        value: 3,
      });
    });

    it("gives up when an addend is not a statistic", () => {
      expect(suggestRequirementMapping("Umysł+Coś Dziwnego 3")).toBeNull();
    });
  });

  describe("written-out alternatives (slash or the word „lub\")", () => {
    const library = { perks: ["Większy Fechtunek", "Większy Fortel", "Przewaga Siły"] };

    it("reads „Większy Fechtunek 5 lub Większy Fortel 5\" as two Atuts", () => {
      expect(suggestRequirementMapping("Większy Fechtunek 5 lub Większy Fortel 5", library)).toEqual({
        kind: "anyOf",
        options: [
          { kind: "ranked", group: "perks", targetKey: "Większy Fechtunek", value: 5 },
          { kind: "ranked", group: "perks", targetKey: "Większy Fortel", value: 5 },
        ],
      });
    });

    it("mixes an Atut with shorthand — „Przewaga Siły lub S 5\"", () => {
      expect(suggestRequirementMapping("Przewaga Siły lub S 5", library)).toEqual({
        kind: "anyOf",
        options: [
          { kind: "ranked", group: "perks", targetKey: "Przewaga Siły", value: 5 },
          { kind: "ranked", group: "characteristics", targetKey: "strength", value: 5 },
        ],
      });
    });

    it("mixes an Atut with an equipment tier once both sides are mappable", () => {
      // Before Wave 8.2 the shield half had no target and the whole text was
      // left alone; now both sides resolve, so it becomes a real alternative.
      expect(suggestRequirementMapping("Większy Fechtunek 4 lub co najmniej średnia tarcza", library)).toEqual({
        kind: "anyOf",
        options: [
          { kind: "ranked", group: "perks", targetKey: "Większy Fechtunek", value: 4 },
          { kind: "ranked", group: "equipment", targetKey: "shield", value: 3 },
        ],
      });
    });

    it("refuses to guess when only one half of a compound resolves", () => {
      // Falling through to the single-target match would read a stray word and
      // assert something the text never said.
      expect(suggestRequirementMapping("Lekka lub średnia zbroja", library)).toBeNull();
      expect(suggestRequirementMapping("Krasnolud lub Bd 6", library)).toBeNull();
    });

    it("reads „Moc/Więź 6\" — the library's most common alternative (96 occurrences)", () => {
      expect(suggestRequirementMapping("Moc/Więź 6")).toEqual({
        kind: "anyOf",
        options: [
          { kind: "ranked", group: "powers", targetKey: "moc", value: 6 },
          { kind: "ranked", group: "powers", targetKey: "wiez", value: 6 },
        ],
      });
    });

    it("lets each side carry its own rank", () => {
      expect(suggestRequirementMapping("Fechtunek 4/Fortel 4")).toEqual({
        kind: "anyOf",
        options: [
          { kind: "ranked", group: "attributes", targetKey: "fencing", value: 4 },
          { kind: "ranked", group: "attributes", targetKey: "artifice", value: 4 },
        ],
      });
    });

    it("gives up entirely when one side cannot be resolved", () => {
      // Half an understood alternative is worse than leaving the text alone.
      expect(suggestRequirementMapping("Moc/Coś Dziwnego 3")).toBeNull();
    });

    it("collapses a repeated target instead of building a fake alternative", () => {
      // Not an alternative — just the same requirement written twice, so it
      // falls through to the ordinary single-target reading.
      expect(suggestRequirementMapping("Siła 3/Siła 3"))
        .toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 });
    });
  });
});
