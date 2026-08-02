# Autorowanie efektów Postaw — arkusz decyzyjny

Wejście: `backup/2026-08-02T06-30-41-035Z/Stance.json`, przepuszczone przez `npm run classify-maneuvers` (offline, bez bazy). CSV z auto-propozycjami: `postawy-classification.csv`.

## Skala — mniejsza, niż wygląda

**214 rekordów to 63 rodziny nazw.** Rangi tej samej postawy są tym samym efektem z inną liczbą:

```
Postawa Defensywna  r1: odporność +1, obrażenia −1
                    r2: +2 / −2      r3: +4 / −3
                    r4: +6 / −4      r5: +8 / −5     r6: +11 / −6
Postawa Widma       r1: obrażenia −2, widmowa kość k4
                    r2: −3, k6       r3: −4, k8      r4: −5, k10
```

Skalowanie **nie jest liniowe** (odporność 1→2→4→6→8→11), więc `copy-effects-across-grades` daje szkic, a nie gotowca — liczby trzeba przejrzeć. Ale kształt efektu autoruje się raz na rodzinę.

**Decydujesz 63 razy, nie 214.** Z tego 31 rodzin da się zamapować dziś.

---

## A · Gotowe do zmapowania — 31 rodzin / 107 rekordów

Wszystko mieści się w istniejącym efekcie `stat` (mode `self`, duration 1 — postawa odnawia go co turę). Podwzorce:

| Wzorzec | Rodziny | Efekt |
|---|---|---|
| Wymiana obrony za ofensywę | Defensywna, Ofensywna, Wojmistrza, Miecznika, Ciężka Tarcza, Rozdarcia, Nemesis | `stat` z dwoma polami o przeciwnych znakach |
| Krytyk | Tygrysa, Węża, Lotosu, Rlin, Diany, Pelgarda | `critPower` / `critRange` |
| Krytyk **przeciwnika** | Dusta Le'grief, Ochronna | `stat` mode `target` z ujemnym `critPower`/`critRange` |
| Kość broni / obrażeń | Dartona, Gerneta, Bastionu, Przez Gniew | `diceGrade` |
| Widmowa kość | Widma, Profesty, Wirtuoza, Zondro, Cienistego Assasyna | `damage` + kość widmowa |
| Obrona pojedyncza | Szopa, Antymagiczna, Zasłona, Irrna El'drima | `dodge` / `resistance` / `block` |
| Inicjatywa z tikiem | Iris, Alcanlorów, Dastana Aore | `stat` + drugi efekt tikowy co turę |

**Do potwierdzenia przez Ciebie (3 rzeczy):**

1. **„Odporność" to `resistance`, a „redukcja" to `protection`?** Tak to czytam z `Defense`, ale te dwa słowa chodzą w opisach parami i pomyłka odwróciłaby sens połowy postaw defensywnych.
2. **„Postawa Antymagiczna: odporność na zaklęcia 2"** — model zna jedną `resistance`, bez typu. Zapisać jako zwykłą odporność (za mocne przeciw broni) czy oznaczyć niesymulowalną do czasu, aż odporności dostaną typ?
3. **Widmowa kość** — `stat.diceGrade` podnosi rangę kości WIODĄCEJ. Widmowa kość obrażeń to osobna kość w `Offense`; w `stat` nie ma dla niej pola. Dorobić `phantomDice`, czy na razie przybliżać ją płaskim `damage`?

---

## B · Bonus do atrybutu — 16 rodzin / 56 rekordów `[BLOKADA]`

Największa pojedyncza grupa po A, i cała stoi na jednym braku: **`StatBuffEffect` zna tylko `precision`, `reflex` i `initiative`.** Fechtunku, fortelu, woli i Harmonii nie da się dziś zapisać.

Dotyczy: Fechmistrza, Dzentelmena, Ratera, Lisa, Kruka, Szulera, Szermierska, Kaname, Kontrfechtunku, Mędrca, Spokoju, Medytacij, Góry, Dłoń Mistrza, Tura, Sztukmistrza.

**Co trzeba zrobić — dwie zmiany, nie jedna:**

1. **Słownik.** `BuffProfile.attributes` ma już wszystkie dziewięć atrybutów, a `statEffectToProfile` używa trzech. Dołożenie `fencing`, `artifice`, `willpower`, `fortitude`, `martialArt` (i charakterystyk dla „+1 Cha", „testy siłowe") to kilkanaście linii w trzech plikach. Tanie.
2. **To, co naprawdę boli.** Testy sporne czytają `snapshot.skills`, **zamrożone przy budowie snapshotu** (`CombatantSnapshot.ts:249`). Bonus nałożony w trakcie walki tam nie dotrze, więc „+1 fechtunek" nie wpłynie na to, do czego fechtunek w ogóle służy. Trzeba, żeby `resolveContestedTest` czytał wartość żywą (snapshot + aktywne bufy), analogicznie do `effectiveOffense`/`effectiveDefense`.

Bez punktu 2 zamapowanie tej grupy byłoby **udawaniem**: efekt zapisany, w symulacji nie robi nic.

---

## C · Wyzwalacze i zakazy — 9 rodzin / 32 rekordy

Dwa różne braki w modelu:

**Wyzwalacz „przy użyciu manewru"** (Stalowy Adwokat, Poczucie Siły, Asary Lu'dean) — warunki `when` znają `onCritical` i `onDamageDealt`, nie znają „gdy użyjesz manewru defensywnego". Do zrobienia jako nowy warunek + tag manewru; podobny kształt jak `forbidTag`, więc kilka godzin.

**Wyzwalacz na wygranym teście spornym** (Kunsztowny/Wyrafinowany Szermierz, Sokół) — wymaga pamięci per przeciwnik („na stałe względem tego, kto przegrał", „cztery z rzędu"). Model nie ma stanu wiązanego z parą walczących. Najdroższe z całej listy.

**Zakaz akcji** (Pełna Defensywna, Fortyfikacji, Styl Grupowy) — „nie można atakować". `forbidTag` blokuje po tagu z biblioteki, ale atak podstawowy nie jest encją z tagiem. Potrzebny osobny `forbidAction: "attack" | "maneuvers" | "stanceChange"`. Mały, dobrze określony efekt — i akurat **Postawa Pełna Defensywna jest jedną z częściej używanych**, więc opłaca się.

---

## D · Koszt i odnowienie manewrów — 3 rodziny / 5 rekordów

Balansu, Zwojów, Virtona Lenter. Model nie zna modyfikatorów cooldownu ani kosztu. Trzy rodziny, pięć rekordów — **rekomendacja: oznaczyć niesymulowalne** i wrócić, gdy pojawi się więcej takich.

## E · Sojusznicy — 4 rodziny / 14 rekordów

Dowódcy, Wodza, Wsparcia, Ściana z tarcz. Silnik jest 1v1; „wszystkim sojusznikom pod dowództwem" nie ma gdzie zadziałać. **Rekomendacja: `simulatable: false` z powodem „efekt drużynowy — silnik 1v1"** — to uczciwsze niż ciche zero i od razu widać to w Kompendium.

---

## Proponowana kolejność

1. **Grupa A teraz** — 31 rodzin, zero zmian w silniku. Po drodze zweryfikujesz na żywo mechanikę zmiany postawy i ranking postaw w Meta.
2. **`forbidAction`** — mały efekt, odblokowuje 3 rodziny, w tym Pełną Defensywną.
3. **Grupa B** — słownik atrybutów + żywe wartości w testach spornych. Największy zysk (56 rekordów), ale to zmiana w silniku, nie autorowanie.
4. **D i E** — oznaczyć niesymulowalne, żeby przestały udawać kolejkę do zrobienia.
5. **Wyzwalacze z pamięcią per przeciwnik (C, druga część)** — dopiero gdy reszta stoi.
