# Cedrus Compendium

Aplikacja do prowadzenia gry w systemie **Cedrus**: karty postaci, bestiariusz, kompendium (atuty, manewry, postawy, stany, zaklęcia, ekwipunek), podręcznik zasad oraz **Laboratorium Systemu** — deterministyczny symulator walki służący do balansowania mechaniki.

Next.js (App Router) + TypeScript + Prisma na MongoDB Atlas. UI: Tailwind + shadcn/ui. Testy: Vitest.

## Uruchomienie

```bash
npm install                # postinstall odpala prisma generate
npm run dev                # http://localhost:3000
```

Wymaga pliku `.env` z `DATABASE_URL` do MongoDB.

## Codzienne komendy

```bash
npm run dev                # serwer deweloperski (turbopack)
npm test                   # vitest
npm run test:coverage      # progi: 85% linii/funkcji/instrukcji, 80% gałęzi
npm run build              # pełny typecheck + build produkcyjny
npm run typecheck          # sam typecheck całego projektu (wolny)
npm run typecheck:scoped   # tylko Combat Lab + Kompendium + schematy — sekundy zamiast minut
npx prisma generate        # po każdej zmianie w prisma/schema.prisma
npx prisma db push         # wypchnięcie schematu do bazy
```

## Struktura

| Katalog | Zawartość |
|---|---|
| `src/domain/` | Czysta logika: postać, walka, wymagania, `combat-lab/` (silnik symulacji). Bez Reacta i bazy. |
| `src/application/` | Komponenty per obszar (characters, compendium, bestiary, combat-lab, admin). |
| `src/persistence/` | Repozytoria, mapowania domena↔Prisma, schematy Zod, zapytania wyszukiwania. |
| `src/app/` | Trasy Next.js i API. |
| `src/common/` | Współdzielone UI, hooki, tłumaczenia. |
| `prisma/` | `schema.prisma` — MongoDB. |
| `scripts/` | Narzędzia jednorazowe i migracje danych — patrz `scripts/README.md`. |
| `public/data/rulebook/` | Podręcznik zasad w JSON (generowany przez `npm run sync-rulebook`). |
| `backup/` | Zrzuty bazy z `npm run backup-mongodb` (poza gitem). |

## Dokumentacja

Testy wyglądu i obsługi telefonu: **[e2e/README.md](e2e/README.md)** — uruchamianie, dane testowe, raporty i sprawdzanie produkcyjnego buildu. Zestaw ma własny serwer i nie korzysta z bazy aplikacji.

- **`ROADMAP.md`** — jedyne źródło prawdy o tym, co zrobione i co zostało. Zaczyna się od tabeli otwartych pozycji.
- **`features-to-implement/`** — plany wykonawcze w toku; `features-to-implement/done/` to archiwum zrealizowanych.
- **`features-to-implement/combat-lab-STATUS.md`** — stan symulatora walki.

## Uwagi praktyczne

- **Nie używaj `npm run <skrypt> -- --apply` w PowerShellu** — separator `--` jest zjadany, flaga nie dociera do skryptu i przebieg po cichu zostaje dry runem. Każdy skrypt zapisujący ma osobny wariant `:apply`.
- **Przed każdą migracją danych:** `npm run backup-mongodb`.
