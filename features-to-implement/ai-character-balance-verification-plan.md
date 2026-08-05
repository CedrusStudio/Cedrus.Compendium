# Plan: sprawdzenie, czy balans generowanych postaci naprawdę działa

Stan repo: 2026-08-03. Dokument opisuje, **jak zmierzyć**, czy warstwa balansu
robi to, co obiecuje — żeby przy kolejnych generacjach nie oceniać na oko.

## Po co osobny plan

Balans jest jedyną częścią tej funkcji, której poprawności nie da się stwierdzić
patrząc na kod. Reszta ma jednoznaczne kryteria: identyfikator albo pasuje do
nazwy, albo nie; wpis albo jest w kompendium, albo go nie ma; wymaganie albo
jest spełnione, albo nie. „Czy ta postać jest dobrze zbalansowana" to pytanie
o rozkład, nie o pojedynczy przypadek, i przez ostatnie generacje odpowiadaliśmy
na nie oglądając jeden draft naraz. To działało do wykrycia grubych błędów
(fortel 3 przy fechtunku 6), ale nie wykryje dryfu.

Dodatkowo balans ma dwa źródła, które mogą się rozjechać:

- **`buildBalanceProfiles`** — mierzy kompendium, opisuje stan faktyczny;
- **`POWER_TIERS`** — ręcznie pisana intencja projektowa.

Jeśli te dwa zaczną mówić co innego, model dostaje sprzeczne sygnały i nikt tego
nie zauważy, dopóki ktoś nie porówna ich ręcznie.

## Warstwa 1 — niezmienniki, testy jednostkowe

Tanie, deterministyczne, uruchamiane przy każdym `npm test`. Część już jest
(`powerTiers.test.ts`, `buildBalanceProfiles.test.ts`); do dopisania:

- **Tabela nie przeczy pomiarowi.** Dla każdego poziomu z `POWER_TIERS`
  sprawdzić, że wartości mieszczą się w rozsądnym oknie wokół zmierzonego
  rozkładu wojaka — na przykład że `weteran.speciality` leży między medianą
  a p90, a `mistrz.speciality` nie przekracza maksimum. Test czyta profil
  z ustalonego zestawu danych, nie z żywej bazy.
- **Monotoniczność między poziomami** — już jest.
- **Specjalność zawsze wyżej niż zwykłe wyszkolenie** — już jest.
- **Profil odrzuca tag zbyt rzadki** — już jest (próg 8 postaci).

## Warstwa 2 — raport o kompendium, skrypt

`scripts/audit-balance.ts`, uruchamiany ręcznie, czyta bazę albo backup
(`--from-backup`, wzorem `dump-ai-character-context.ts`) i wypisuje:

- profil każdego tagu przekraczającego próg: mediana, p90, maksimum każdej
  cechy, liczba manewrów i atutów;
- **tagi tuż pod progiem** — kandydaci do uzupełnienia, dziś niewidoczni;
- **rozjazd tabeli z pomiarem** — dla każdego poziomu, o ile odbiega od
  zmierzonego rozkładu; to jest sygnał „czas zaktualizować `POWER_TIERS`
  albo dopracować postacie w bazie";
- **postacie odstające** — te, których najwyższy atrybut leży poza p99 albo
  które mają zero manewrów mimo tagu bojowego. To one zaniżają mediany
  i psują profil, więc warto je znać.

Raport do `ai-workspace/reports/balance.md` (folder już ignorowany).

## Warstwa 3 — porównanie wygenerowanej postaci z profilem

To jest właściwa odpowiedź na „czy AI trzyma balans". Po każdej akceptacji
draftu mamy postać, którą można zmierzyć tym samym `buildBalanceProfiles`.

Do dopisania w podglądzie draftu, obok „Do poprawienia po zapisie": sekcja
**„Odchylenie od profilu"**, pokazująca dla najważniejszych cech, gdzie postać
leży względem mediany i p90 swojego tagu. Nie jako błąd — jako liczba, którą
widzisz przed zatwierdzeniem.

Kryterium akceptacji, świadomie miękkie: specjalność w przedziale p75–max,
zwykłe wyszkolenie w okolicy mediany, liczba manewrów w przedziale
mediana ± 40%. Postać poza tym przedziałem nie jest błędna, ale zasługuje na
spojrzenie.

## Warstwa 4 — zestaw regresyjny opisów

Pięć do ośmiu opisów pokrywających różne archetypy (wojak, mag, zbój, łucznik,
postać niebojowa), trzymanych w `ai-workspace/benchmarks/`. Do każdego
zapisany ostatni wynik: statystyki, liczba manewrów, atutów, postaw,
niespełnione wymagania.

Uruchamiane **ręcznie i rzadko** — każdy przebieg kosztuje. Sens jest taki, że po
zmianie promptu albo profili widać, co się poprawiło, a co zepsuło, zamiast
wnioskować z jednej postaci. Poprzednie tury pokazały, że poprawki potrafią się
znosić: zakaz wpisywania efektów atutów do `testBonus` sprawił, że model zaczął
je odejmować od bazy.

## Kolejność

Warstwa 1 jest darmowa i powinna powstać od razu — to kilka asercji nad danymi,
które już mamy. Warstwa 2 jest samodzielnie użyteczna nawet bez AI: powie ci,
które tagi w kompendium są za rzadkie i które postacie odstają. Warstwa 3 ma
sens dopiero, gdy 1 i 2 potwierdzą, że profile są wiarygodne. Warstwa 4 jest
najdroższa i najmniej pilna — do rozważenia, gdy prompt przestanie się zmieniać
co turę.

## Czego ten plan świadomie nie robi

Nie proponuje **twardego progu blokującego** zapis postaci odstającej od
profilu. Zgodnie z decyzją zapisaną w `checkRequirement.ts` (Marek, 2026-07-25)
warstwa oceny raportuje i nie blokuje — prowadzący ma prawo świadomie zrobić
postać poza skalą, a profil opisuje zwyczaj, nie regułę.

Nie proponuje też automatycznego aktualizowania `POWER_TIERS` z pomiaru. Tabela
jest intencją; gdyby przepisywała się z bazy, przestałaby być czymkolwiek innym
niż drugą kopią profili.
