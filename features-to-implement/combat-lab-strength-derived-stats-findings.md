> **✅ DECYZJA PODJĘTA (2026-07-24):** wybrano alternatywę z ostatniej sekcji —
> **bez zmiany silnika**. Postawy/Stany/Bufy podnoszące obrażenia z Siły autoruje
> się wprost na Obrażeniach, nie na cesze Siła. Powód: automatyczna derywacja
> groziła podwójnym naliczeniem dla istniejącej zawartości Kompendium (ryzyko
> cichej zmiany balansu). Decyzja i uzasadnienie udokumentowane w kodzie:
> `src/domain/characters/buffs/applyBuffProfile.ts` (komentarz nad
> `applyBuffProfile`) + test regresyjny w `applyBuffProfile.test.ts`. ROADMAP 0.2
> zamknięte na tej podstawie — reszta dokumentu to historyczna diagnoza.

# Ustalenia: przeliczanie statystyk pochodnych (Siła → Obrażenia)

> Diagnostyka z roadmapy **Fala 0 / Task 0.2**. Cel: sprawdzić, czy modyfikator
> cechy podstawowej (np. `+Siła` z postawy „Wir Walki”) przelicza się na
> statystyki pochodne (Obrażenia) przed uruchomieniem symulacji.

## Wniosek (TL;DR)

**Nie przelicza się — i nie może się przeliczyć, bo derywacja Siła → Obrażenia
nie istnieje w kodzie silnika.** To nie jest błąd kolejności kalkulacji; to
brakujący element modelu. Obrażenia są w silniku wartością **autorską/zapisaną**,
całkowicie niezależną od cechy `strength`.

## Co mówi podręcznik

`public/data/rulebook/cechy-i-umiejetnosci.json` (Siła):
> „Cecha odpowiadająca na ilość obrażeń w walce fizycznej oraz za testy siłowe.
> Osoby walczące bronią dwuręczną otrzymują 1,5 modyfikatora z siły do obrażeń
> […]. Ujemna siła zmniejsza obrażenia.”

`system-walki.json` potwierdza: broń jednoręczna → `+1×` modyfikator z siły do
obrażeń; dwuręczna → `+1,5×` (zaokrąglane w dół). Czyli **reguła mówi wprost:
Obrażenia_fizyczne = f(Siła, chwyt broni)**.

## Co robi kod (stan faktyczny)

1. **Brak derywacji.** `src/domain/characters/combat/Offense.ts` przechowuje
   `damageBonus` jako wartość wprost. W całym `src/domain` nie ma funkcji liczącej
   modyfikator obrażeń z Siły (brak `×1 / ×1.5`, brak obsługi ujemnej Siły).

2. **Bufy cechy i bufy obrażeń są rozłączne.**
   `src/domain/characters/buffs/applyBuffProfile.ts` (`applyBuffProfile`, l. 50–79)
   nakłada `characteristics.strength` **oraz** `offense.damageBonus` jako **dwa
   niezależne, addytywne delty**. Podniesienie Siły nie przelicza `damageBonus`.
   Profil, który ma dawać `+Siła` i `+Obrażenia`, musi nieść **oba** delty ręcznie.

3. **Efekty postaw/stanów nie potrafią nawet wyrazić `+Siła`.**
   `StatBuffEffect` (`src/domain/combat-lab/effects/statBuff.ts`,
   `src/domain/combat-lab/effects/Effect.ts`) ma pola tylko na statystyki
   pochodne: `damage`, `diceGrade`, `block/parry/dodge/protection/resistance/
   immunity`, `precision`, `reflex`, `initiative`, `barrier`, `critPower/critRange`.
   **Nie ma pola na cechę (`strength` itd.).** Postawa „Wir Walki (+Siła)” w Combat
   Lab musi więc być autorsko zapisana jako `+Obrażenia (+diceGrade …)`, a nie
   `+Siła`.

4. **`gradeFromStat` / `selfStat` / `opponentStat` czytają Siłę „na surowo”.**
   `src/domain/combat-lab/engine/scaleSource.ts` (`statMagnitude`, l. 29–33) czyta
   `runtime.snapshot.skills[group][key]` — czyli Siłę **zapieczoną w snapshotcie**.
   Runtime’owe bufy stat (`activeBuffs`) tego nie ruszają. Efekt: „kość równa
   sile” i skalowanie „za każdą Siłę” **ignorują** runtime’owe wzmocnienia Siły.

## Kolejność kalkulacji — ta część jest OK

`src/domain/combat-lab/engine/CombatantSnapshot.ts` → `toCombatantSnapshot`
(l. 198–238) najpierw nakłada profile bufów (`applyActiveBuffProfile` →
`buffed`), a **dopiero potem** liczy `maxHp` i kopiuje `offenses`/`skills` z
`buffed`. Więc bufy **zapieczone na karcie** trafiają do snapshotu przed
zamrożeniem. Problem nie leży w kolejności — leży w braku samej reguły
Siła → Obrażenia.

## Podsumowanie odpowiedzi na pytanie z Taska 0.2

- Modyfikator `+Siła` **nie** aktualizuje bazowych Obrażeń — bo silnik nie zna
  zależności Siła → Obrażenia.
- Dwa światy (surowa cecha vs. obrażenia pochodne) są sprzęgnięte **wyłącznie** w
  wartościach zapieczonych na karcie postaci; po żadnym bufie nic się nie
  przelicza.

## Rekomendacja (do decyzji — to zmiana mechaniki, nie diagnostyka)

Wdrożenie reguły wymaga decyzji projektowych, dlatego wychodzi poza zakres
„weryfikacji” 0.2:

1. **Źródło chwytu broni.** `Offense.style` niesie `"Jednoręczny"` itd. — trzeba
   ustalić mapowanie chwyt → mnożnik (`×1` / `×1.5` w dół) i obsłużyć ujemną Siłę.
2. **Gdzie liczyć.** Rekomendacja: funkcja `deriveStrengthDamage(character)`
   przeliczająca składnik „z Siły” w `damageBonus`, wołana **po** nałożeniu bufów
   cech (na końcu `applyBuffProfile`/`toCombatantSnapshot`), aby `+Siła`
   automatycznie podnosiło Obrażenia. Uwaga: żeby uniknąć podwójnego liczenia,
   składnik „z Siły” musi być trzymany osobno od autorskiego `damageBonus`.
3. **Model bufów.** Rozważyć dodanie pola cechy do `StatBuffEffect`, aby postawy
   mogły wyrażać `+Siła` wprost (dziś muszą podawać `+Obrażenia`).
4. **Zakres.** Zdecydować, czy dotyczy tylko fizycznych ataków w zwarciu (reguła
   mówi „w walce fizycznej”), i jak traktować `gradeFromStat`/skalowanie od Siły
   względem runtime’owych bufów.

Alternatywa (mniejszy koszt, bez zmiany silnika): **utrzymać obecny model** i
przyjąć zasadę, że postawy/stany autoruje się od razu na statystykach pochodnych
(`+Obrażenia`), a nie na cechach — wtedy 0.2 zamyka się na tej diagnozie.
