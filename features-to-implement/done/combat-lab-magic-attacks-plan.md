# Plan: Magia jako ataki w Combat Lab

Plan implementacji — **bez kodu.** Cel: umożliwić symulację postaci‑zaklinaczy, tj. traktować **zaklęcia jako akcje bojowe** (atak dystansowy magiczny opłacany esencją), a nie tylko manewry. Osadzony w realnym modelu.

---

## 1. Realny model czarów (co już jest)

- **`Power`** (`Power.ts`): `essence` (koszt poziomu), `spells: Spell[]`, `powerSpecificationId` (wskazuje na `PowerSpecification`).
- **`PowerSpecification`**: `offenses: PowerOffense[]`, gdzie `PowerOffense = { spellOffense: WeaponOffense; spellDamage: DamageOffense; description; cost }`. **To stąd bierze się obrażenie czaru.**
- **`Spell = Perk & Castable & { cost: SpellCost }`** — akcja rzucania z czasem rzucania i kosztem (`SpellCost`, np. stała 20 esencji).
- **Silnik już ma**: `attackKind: "rangedMagic"` (kategoria „blokowane", test precyzji), `resolveRangedAttack`, oraz **pulę zasobów** (`resources.essence/mana`) i koszt esencji jako parametr symulacji.

**Wniosek:** rdzeń (rzut dystansowy magiczny + zasoby) już istnieje. Brakuje: załadowania zaklęć do snapshotu, uczynienia z nich **wybieralnych akcji** z kosztem, i wyceny AI.

---

## 2. Luka i decyzje projektowe

1. **Indirection Power → PowerSpecification.** Obrażenie zaklęcia nie leży na `Spell`, tylko na ofensywie `PowerSpecification` powiązanej przez `Power.powerSpecificationId`. Snapshot musi **rozwiązać** to powiązanie przy budowie (zaklęcie → jego Power → PowerSpecification → wybrana `PowerOffense`).
2. **Które PowerOffense?** `PowerSpecification.offenses` to lista. Trzeba wybrać jedną (domyślną/pierwszą) lub udostępnić wybór (jak wybór ofensywy dla broni). v1: pierwsza/„domyślna".
3. **Koszt.** `Spell.cost` (`SpellCost`) → koszt esencji rzutu. Egzekwować przez pulę `resources.essence` (już mamy): zaklęcie dostępne tylko, gdy stać; użycie odejmuje koszt.
4. **Akcja vs manewr.** Zaklęcie to **osobna akcja** (jak atak), nie manewr. Model akcji (`Action` w `actionEconomy`) zyskuje wariant `{ kind: "spell"; spell }`.

---

## 3. Model danych w snapshocie

`CombatantSnapshot` zyskuje:
```
spells?: {
  id: string;
  name: string;
  offense: Offense;      // rozwiązana z PowerSpecification (spellOffense+spellDamage)
  costEssence: number;   // z SpellCost
  castTime: CastTime;
  cooldown?: number;
  category: "blokowane";  // magia dystansowa
}[]
```
`toCombatantSnapshot` (opcja `includeSpells` / zawsze): dla każdego `power` postaci znajdź `PowerSpecification` (wymaga dostępu do specyfikacji — dołożyć do wejścia snapshotu lub do Character), zbuduj `Offense` z `PowerOffense` (leadingWeapon = spellOffense, damageBonus = spellDamage), policz koszt z `SpellCost`. **Uwaga:** `PowerSpecification` może nie być w grafie `Character` — trzeba sprawdzić, skąd je wczytać (repo/relacja); jeśli brak, przekazać mapę specyfikacji jako opcję snapshotu.

---

## 4. Silnik

- **`Action`** (`actionEconomy.ts`): dodać `{ kind: "spell"; spell: SnapshotSpell }`.
- **Dostępność**: `availableSpells(actor)` = zaklęcia, na które stać (`resources.essence >= costEssence`) i nie na cooldownie. Zwracane w fazie akcji (obok ataku/manewrów).
- **Rozstrzygnięcie** (`runCombat` / `executeAction`): dla `spell` wywołać `resolveRangedAttack` z `category: "blokowane"`, ofensywą zaklęcia i buffami; po trafieniu odjąć koszt esencji (`actor.resources.essence -= costEssence`), zalogować event `spellCast`.
- **Ekonomia**: zaklęcie zajmuje akcję (jak manewr proaktywny lub zamiast ataku? — decyzja: czy zaklęcie jest zamiast ataku, czy dodatkowe). v1: **zamiast ataku** (rzucasz ALBO atakujesz) — bliższe zasadom; do potwierdzenia.
- **Log/Replay**: nowy event `spellCast { actorId; targetId; spellName; hit; dealt; remainingHp; costEssence }` + opis PL.

---

## 5. AI (polityki)

- **greedy/value**: `spell` scoruje się jak atak — `expectedOffenseDamage(spell.offense)` (dla dystansu magicznego), minus ewentualny dyskonto za koszt (nie chcemy rzucać, gdy zabraknie esencji na później). v1: prosty scoring = oczekiwane obrażenia zaklęcia; wybór najlepszej opcji spośród {atak, zaklęcia stać‑na}.
- Zaklęcie bez esencji → niedostępne (nie w `available`).

---

## 6. UI

- **CombatantPicker / config**: startowa esencja już jest. Ewentualnie podgląd listy zaklęć postaci w `CombatantStatsCard` (tryb, obrażenia, koszt).
- **Replay**: renderować `spellCast`.
- (Później) wybór domyślnego zaklęcia / PowerOffense, jak wybór ofensywy.

---

## 7. Etapy

1. ✅ **Rozwiązanie danych**: `SnapshotSpell` + `buildSpells` w `toCombatantSnapshot` (Power → PowerSpecification → wybrana `PowerOffense`); ładowanie specyfikacji hookiem `usePowerSpecifications` (searchClient by‑id). Test mapowania w `combatantSnapshot.test.ts`.
2. ✅ **Model akcji**: `Action { kind:"spell" }` + `availableSpells` (esencja + cooldown) + `recordAction` (zajmuje akcję ataku, odejmuje esencję, ustawia cooldown) + `tickSpellCooldowns`. Test `spellAction.test.ts`.
3. ✅ **Rozstrzygnięcie**: `executeAction` case „spell" (reuse `resolveRangedAttack` z `offenseOverride`, kategoria „blokowane") + event `spellCast` + `describeEvent` + `buildReplayFrames` + `summarizeCombat`.
4. ✅ **AI**: scoring zaklęć w greedy/value (`expectedOffenseDamage(spell.offense)`).
5. ✅ **UI**: podgląd zaklęć w `CombatantStatsCard`, wybór `PowerOffense` w `CombatantPicker`, wstrzyknięcie specyfikacji w `SimulationRunner`, opis `spellCast` w Replay.
6. ✅ **Autorstwo/analiza**: `summarizeCombat` liczy `spellUsage` (zdarzenia `spellCast`), agregacja w `aggregateResults` (`spellUsage`/`mostUsedSpell`); Meta ma `mostUsedSpells`/`neverUsedSpells` (+ karta w `MetaAnalyzer`); Synergy ablatuje też zaklęcia. Testy w `meta.test.ts`.

---

## 8. Decyzje (potwierdzone) i otwarte pytania

**Potwierdzone przez autora:**
- **Zaklęcie ZAMIAST ataku** — w danej turze rzucasz ALBO atakujesz (spell zajmuje akcję ataku).
- **Wybór PowerOffense** — gdy specyfikacja ma wiele ofensyw, ma być **wybór** (nie tylko pierwsza). v1: `SnapshotSpell` niesie wybraną ofensywę; domyślnie pierwsza, z możliwością wyboru w konfiguracji (jak wybór ofensywy broni).
- **Brak regeneracji esencji** między rundami — pula startowa maleje i się nie odnawia.

**Pozostałe otwarte:

1. **`PowerSpecification` — POTWIERDZONE:** domenowy `Character` niesie `powers` (z `spells` i `powerSpecificationId`), ale **NIE** obiekty `PowerSpecification` — te są w osobnej kolekcji, łączone tylko przez id (patrz `charactersRepository`: „Power specifications - just collect the IDs"). Więc snapshot **musi je doładować**: pobrać specyfikacje po `powerSpecificationIds` (jest klient/hook do specyfikacji) i przekazać do `toCombatantSnapshot` jako opcję `powerSpecifications: Record<id, PowerSpecification>`. To jest pierwszy, konieczny krok etapu 1 (warstwa danych), zanim ruszymy silnik.
2. **Zaklęcie zamiast ataku czy dodatkowo?** (v1: zamiast; potwierdzić z zasadami.)
3. **Wybór PowerOffense**, gdy specyfikacja ma wiele ofensyw (v1: pierwsza).
4. **Regeneracja esencji** między rundami (dziś pula jest statyczna) — czy modelować odnowę? v1: nie (pula startowa maleje).
5. **Koszt złożony** (`SpellCost` bywa skalowany) — v1: policzyć wartość efektywną kosztu na start.

---

## 9. Zależności i ryzyka

- **Największy blocker: dostęp do `PowerSpecification`** — bez tego nie ma obrażeń zaklęcia. Rozstrzygnąć na etapie 1.
- Reużywamy `resolveRangedAttack` (magia = „blokowane") i pulę zasobów — więc rdzeń walki jest gotowy; ryzyko głównie w warstwie danych (Power→spec→offense) i ekonomii akcji.
- Zakres świadomie **v1 = obrażeniowe zaklęcia** (spell = magiczny atak z kosztem). Zaklęcia nie‑obrażeniowe (buffy/kontrola) można autorować jako manewry z efektami — nie wymagają tej ścieżki.
