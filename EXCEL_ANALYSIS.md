# Analiza Struktury Excel vs Modele TypeScript

## 📊 Podsumowanie Arkuszy Excel

Plik `Wielka Księga Wojowników.xlsm` zawiera **12 arkuszy** z następującymi danymi:

### 1. **Atuty Bojowe** (125 wierszy)
- **Kolumny**: Nazwa, Działanie, Koszt, Wymagania
- **Model docelowy**: `Perk`
- **Dopasowanie**: 67%
- **Przykład danych**:
  ```
  Nazwa: "Finezja w walce"
  Działanie: "+ (Zręczność) dmg, zamiast siły. Kara ujemnej siły..."
  Koszt: "Z"
  Wymagania: "Zr 3"
  ```

### 2. **Atuty Defensywne** (174 wiersze)
- **Kolumny**: Nazwa, Działanie, Koszt, Wymogi
- **Model docelowy**: `Perk`
- **Dopasowanie**: 50%
- **Uwaga**: Kolumna `Wymogi` zamiast `Wymagania`

### 3. **Walka Wrecz** (65 wierszy)
- **Kolumny**: Nazwa, Działanie, Czas, Koszt, Wymagania
- **Model docelowy**: `Maneuver` lub `Perk`
- **Dopasowanie**: 67%
- **Uwaga**: Zawiera kolumnę `Czas` (castTime)

### 4. **Harmonia** (57 wierszy)
- **Kolumny**: Nazwa, Działanie, Czas/H, Koszt, Wymogi
- **Model docelowy**: `Spell` lub `Maneuver`
- **Dopasowanie**: 50%
- **Uwaga**: Specjalny system harmonii - może wymagać custom pola

### 5-11. **Manewry (M Ogolne, M Umiejętności, M Broni, M Harmonia, M Kulturowe, M Propozycje, M Total)**
- **Kolumny**: Typ, Nazwa, Nazwa_1, Działanie, Częstotliwość, Koszt, Wymagania, War, ST, Typ_1
- **Model docelowy**: `Maneuver`
- **Dopasowanie**: 100%
- **Sumaryczna liczba wierszy**: ~1100+
- **Uwagi**:
  - `Częstotliwość` → `cooldown`
  - `War` → `grade` (wartość/warstwa)
  - `ST` → `castTime` (standardowa tura)
  - `Nazwa_1` - duplikat `Nazwa`?
  - `Typ` i `Typ_1` - kategorie/tagi

### 12. **Postawy i Stany** (247 wierszy)
- **Kolumny**: Typ, PostawaSokoła2, Nazwa, Działanie, Koszt, Wymagania, Typ_1
- **Model docelowy**: `Mode` (Stance lub State)
- **Dopasowanie**: 83%
- **Uwaga**: Kolumna `PostawaSokoła2` - prawdopodobnie relacja/wymóg

---

## 🗺️ Mapowanie Kolumn PL → EN

| Polski | Angielski (Model) | Typ | Uwagi |
|--------|------------------|-----|-------|
| `Nazwa` | `name` | string | ✅ Zawsze obecne |
| `Działanie` | `description` | string | ✅ Zawsze obecne |
| `Koszt` | `price` | string/number | ❓ Wymaga parsowania (Z, S, BB, SSB) |
| `Wymagania` / `Wymogi` | `requirements` | string[] | ❓ Wymaga parsowania (przecinki) |
| `Częstotliwość` | `cooldown` | number | ❓ Wymaga parsowania (1//D, 1//6) |
| `War` | `grade` | number | ⚠️ Częściowo wypełnione (47-57%) |
| `ST` | `castTime` | CastTime | ⚠️ Częściowo wypełnione, wymaga mapowania |
| `Typ` / `Typ_1` | `tags` | Tag[] | ❓ Wymaga konwersji na lowercase, single-word |
| `Czas` / `Czas/H` | `castTime` | CastTime | ⚠️ Różne formaty |

---

## 🎯 Strategia Konwersji

### Krok 1: Określenie Typu Encji

Na podstawie arkusza i kolumn określ typ encji:

```typescript
if (sheet.includes('Manewry') || sheet.includes('M ')) {
  return 'Maneuver';
}
if (sheet === 'Postawy i Stany') {
  return row['Typ'] === 'Stany' ? 'State' : 'Stance';
}
if (sheet.includes('Atuty') || sheet.includes('Walka Wrecz') || sheet.includes('Harmonia')) {
  return 'Perk';
}
```

### Krok 2: Parsowanie Kosztów

Koszty mają specjalny format literowy:
- `Z` - Zwykły
- `S` - Standardowy  
- `B` - Bronzowy
- Kombinacje: `ZS`, `BB`, `SSB`, `SS+S*|cecha|`

**Zalecenie**: Zachować jako string lub stworzyć enum.

### Krok 3: Parsowanie Wymagań

Wymagania są tekstem oddzielonym przecinkami:
```
"Zr 3, Int 2, 2 widmowe manewry"
```

**Strategia**: Rozdziel po przecinku → trim → array.

### Krok 4: Parsowanie Częstotliwości → Cooldown

Format: `1//D`, `1//6`, `1//3`, `2H`
- `1//D` → raz na dzień
- `1//6` → raz na 6 rund
- `2H` → 2 punkty harmonii

**Zalecenie**: Parsuj liczby lub zachowaj jako string.

### Krok 5: Parsowanie CastTime

Możliwe wartości:
- ST = 1 → Standardowa
- ST = 2 → Pełnorundowa?
- Czas zawiera: "Natychmiastowy", "Standardowy"

**Mapowanie**:
```typescript
const castTimeMap: Record<string, CastTime> = {
  '1': 'Standardowa',
  '2': 'Pełnorundowa',
  'Natychmiastowy': 'Natychmiastowa',
  'Nadnatychmiastowy': 'Nadnatychmiastowa'
};
```

### Krok 6: Generowanie Tags

Z kolumn `Typ` i `Typ_1`:
```typescript
const tags: Tag[] = [
  row['Typ']?.toLowerCase().replace(/\s+/g, '-'),
  row['Typ_1']?.toLowerCase().replace(/\s+/g, '-')
].filter(Boolean);
```

**Walidacja**: Użyj `isValidTag()` z modelu.

---

## ⚠️ Wyzwania i Pytania

### 1. **Duplikaty Nazwa / Nazwa_1**
Arkusze manewrów mają `Nazwa` i `Nazwa_1` - czy to to samo?
**Zalecenie**: Sprawdź różnice, użyj `Nazwa_1` jako primary (bardziej czytelne).

### 2. **Puste Grade i CastTime**
Tylko 47-57% wierszy ma wypełnione `War` i `ST`.
**Zalecenie**: Ustaw domyślne wartości z `defaultManeuver`, `defaultPerk`.

### 3. **Specjalne Systemy (Harmonia, PostawaSokoła)**
Niektóre arkusze mają niestandardowe kolumny.
**Zalecenie**: Custom parsery lub dodatkowe pola w description.

### 4. **Format Kosztów**
Bardzo nietypowy format tekstowy.
**Zalecenie**: Albo zachowaj jako string, albo stwórz typ:
```typescript
type Cost = 'Z' | 'S' | 'B' | 'ZS' | 'BB' | 'SSB' | string;
```

### 5. **Tagi vs Kategorie**
`Typ` i `Typ_1` - czy to tagi czy kategorie?
**Modele wymagają**: Tag[] (lowercase, no spaces)
**Zalecenie**: Konwertuj na valid tags lub dodaj pole `category`.

---

## 📁 Proponowana Struktura Wyjściowa

```
formatted-data/
├── perks.json              # Atuty Bojowe + Defensywne + Walka Wrecz + Harmonia
├── maneuvers.json          # M Ogolne + M Umiejętności + M Broni + M Harmonia + M Kulturowe
├── stances.json            # Postawy i Stany (gdzie Typ='Postawy')
├── states.json             # Postawy i Stany (gdzie Typ='Stany')
└── raw/
    ├── all-maneuvers.json  # M Total (backup)
    └── proposals.json      # M Propozycje (nieukończone dane)
```

---

## 🚀 Następne Kroki

1. ✅ **DONE**: Analiza struktury Excel
2. ⏭️ **TODO**: Implementacja mapperów dla każdego typu
3. ⏭️ **TODO**: Parsery dla złożonych pól (Cost, Requirements, Cooldown)
4. ⏭️ **TODO**: Walidacja zgodności z modelami TS
5. ⏭️ **TODO**: Generowanie JSONów
6. ⏭️ **TODO**: Import do MongoDB

---

## 🔧 Techniczne Szczegóły

### Wymagane Transformacje

```typescript
interface ExcelRow {
  Nazwa?: string;
  Nazwa_1?: string;
  Działanie?: string;
  Koszt?: string;
  Wymagania?: string;
  Częstotliwość?: string;
  War?: number | string;
  ST?: number | string;
  Typ?: string;
  Typ_1?: string;
}

interface ManeuverMapping {
  id: string;                                    // ulid()
  name: string;                                  // Nazwa_1 || Nazwa
  description: string;                           // Działanie
  grade: number;                                 // War || 1
  castTime: CastTime;                           // parseCastTime(ST)
  cooldown?: number;                            // parseCooldown(Częstotliwość)
  price: number;                                // parseCost(Koszt) → liczba punktów
  requirements: string[];                       // Wymagania.split(',').map(trim)
  tags: Tag[];                                  // parseAndValidateTags([Typ, Typ_1])
}
```

### Parsery do Implementacji

1. `parseCostToNumber(cost: string): number` - Z→1, S→2, B→1, ZS→3
2. `parseCooldown(freq: string): number | undefined` - 1//6 → 6, 1//D → null
3. `parseCastTime(st: string | number): CastTime` - 1→Standardowa, 2→Pełnorundowa
4. `parseRequirements(req: string): string[]` - split i trim
5. `parseAndValidateTags(types: string[]): Tag[]` - lowercase, dash-case, valid

---

## 📊 Statystyki Danych

| Arkusz | Wiersze | Model | Kategoria | Priorytet |
|--------|---------|-------|-----------|-----------|
| M Total | 574 | Maneuver | Wszystkie manewry | 🔴 High |
| Postawy i Stany | 247 | Mode | Stances + States | 🟡 Medium |
| M Broni | 233 | Maneuver | Manewry broni | 🟡 Medium |
| M Ogolne | 175 | Maneuver | Manewry ogólne | 🟡 Medium |
| Atuty Defensywne | 174 | Perk | Defensywa | 🟢 Low |
| Atuty Bojowe | 125 | Perk | Ofensywa | 🟢 Low |
| M Umiejętności | 119 | Maneuver | Manewry umiejętności | 🟡 Medium |
| Walka Wrecz | 65 | Perk | Walka wręcz | 🟢 Low |
| Harmonia | 57 | Perk/Spell | System harmonii | 🔵 Special |
| M Harmonia | 38 | Maneuver | Manewry harmonii | 🔵 Special |
| M Kulturowe | 17 | Maneuver | Manewry kulturowe | 🟢 Low |
| M Propozycje | 15 | - | Propozycje (skip) | ⚪ Ignore |

**Total: ~1800+ encji do konwersji**

---

## 💭 Pytania do Rozstrzygnięcia

1. Czy arkusz **M Total** (574 wiersze) zawiera wszystkie manewry z pozostałych arkuszy M_*?
   - Jeśli TAK → używaj tylko M Total
   - Jeśli NIE → merguj wszystkie arkusze M_*

2. Czy **Nazwa** i **Nazwa_1** to to samo?
   - Sugerowane: użyj Nazwa_1 (bardziej czytelne)

3. Jak traktować **PostawaSokoła2** w arkuszu "Postawy i Stany"?
   - Opcja A: Jako requirements
   - Opcja B: Jako parent/category
   - Opcja C: Ignoruj

4. Czy stworzyć **custom type dla Cost** czy parsować na number?
   - Dla MongoDB lepiej number, ale tracimy informację o typie

5. Czy **Harmonia** to osobny system czy częśc Maneuvers?
   - Może wymagać custom pola `harmonyPoints`
