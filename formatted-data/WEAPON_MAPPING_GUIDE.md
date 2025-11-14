# Przewodnik Mapowania Danych Broni

## Struktura Modelu TypeScript

### WeaponOffense
```typescript
{
  amount: number;      // Ilość kości broni
  grade: number;       // Ranga kości (k6 = grade 3, k8 = grade 4, k12 = grade 6)
  bonus: number;       // Bonus do każdej kości broni
  critical: {
    power: number;     // Siła krytyka (dodatkowe obrażenia przy krytyka)
    range: number;     // Zasięg krytyka (rozszerzenie zakresu krytyka)
  }
}
```

### DamageOffense
```typescript
{
  amount: number;      // Ilość kości obrażeń (zwykle 0 dla zwykłych broni)
  grade: number;       // Ranga kości obrażeń (zawsze 1 jako defaultDiceGrade)
  bonus: number;       // Bonus do obrażeń (dmg +X)
}
```

## Konwersja Rangi Kości
- k4 → grade = 2
- k6 → grade = 3
- k8 → grade = 4
- k10 → grade = 5
- k12 → grade = 6

**Wzór:** `grade = (wartość_kości / 2)`

## Przykłady Parsowania

### Przykład 1: "k6+1, dmg +1, fechtunek +1, siła krytyka -1"

**Parsowanie:**
- `k6` → offense.grade = 3, offense.amount = 1
- `+1` (przy k6) → offense.bonus = 1
- `dmg +1` → damageBonus.bonus = 1
- `siła krytyka -1` → critical.power = -1 (lub 0 jeśli nie akceptujemy ujemnych)
- Brak `szansa krytyka` → critical.range = 0
- `fechtunek +1` → description: "Fechtunek +1"

**Wynik:**
```json
{
  "offense": {
    "amount": 1,
    "grade": 3,
    "bonus": 1,
    "critical": {
      "power": 0,
      "range": -1
    }
  },
  "damageBonus": {
    "amount": 0,
    "grade": 1,
    "bonus": 1
  },
  "description": "Fechtunek +1"
}
```

### Przykład 2: "k6, siła krytyka +1, inicjatywa +1"

**Parsowanie:**
- `k6` → offense.grade = 3, offense.amount = 1
- Brak bonusu → offense.bonus = 0
- `siła krytyka +1` → critical.power = 1
- Brak `szansa krytyka` → critical.range = 0
- Brak `dmg` → damageBonus.bonus = 0
- `inicjatywa +1` → description: "Inicjatywa +1"

**Wynik:**
```json
{
  "offense": {
    "amount": 1,
    "grade": 3,
    "bonus": 0,
    "critical": {
      "power": 1,
      "range": 0
    }
  },
  "damageBonus": {
    "amount": 0,
    "grade": 1,
    "bonus": 0
  },
  "description": "Inicjatywa +1"
}
```

### Przykład 3: "k8+1, fechtunek +1"

**Parsowanie:**
- `k8` → offense.grade = 4, offense.amount = 1
- `+1` (przy k8) → offense.bonus = 1
- Brak `siła krytyka` → critical.power = 0
- Brak `szansa krytyka` → critical.range = 0
- Brak `dmg` → damageBonus.bonus = 0
- `fechtunek +1` → description: "Fechtunek +1"

**Wynik:**
```json
{
  "offense": {
    "amount": 1,
    "grade": 4,
    "bonus": 1,
    "critical": {
      "power": 0,
      "range": 0
    }
  },
  "damageBonus": {
    "amount": 0,
    "grade": 1,
    "bonus": 0
  },
  "description": "Fechtunek +1"
}
```

### Przykład 4: "(+1)k12+2, szansa krytyka +2, siła krytyka +2"

**Parsowanie:**
- `(+1)k12` → offense.amount = 1 (+1 do ilości kości), offense.grade = 6
- `+2` (przy k12) → offense.bonus = 2
- `szansa krytyka +2` → critical.range = 2
- `siła krytyka +2` → critical.power = 2
- Brak `dmg` → damageBonus.bonus = 0
- `(+1)` przy kościach → description: "Kości broni +1"

**Wynik:**
```json
{
  "offense": {
    "amount": 1,
    "grade": 6,
    "bonus": 2,
    "critical": {
      "power": 2,
      "range": 2
    }
  },
  "damageBonus": {
    "amount": 0,
    "grade": 1,
    "bonus": 0
  },
  "description": "Kości broni +1"
}
```

## Wzorce Regex dla Parsowania

### Podstawowa kość broni
```regex
(\d+)?k(\d+)([+-]\d+)?
```
- Grupa 1: ilość kości (opcjonalna, domyślnie 1)
- Grupa 2: wartość kości (4, 6, 8, 10, 12)
- Grupa 3: bonus do kości (opcjonalny)

### Bonus do kości broni w nawiasach
```regex
\(\+(\d+)\)k(\d+)
```
- Oznacza zwiększenie ilości kości o wartość w nawiasie

### Damage bonus
```regex
dmg\s*([+-]\d+)
```
- Grupa 1: wartość bonusu do obrażeń

### Siła krytyka
```regex
siła krytyka\s*([+-]\d+)
```
- Grupa 1: wartość siły krytyka (critical.power)

### Szansa krytyka
```regex
szansa krytyka\s*([+-]\d+)
```
- Grupa 1: wartość szansy krytyka (critical.range)

### Dodatkowe modyfikatory (do description)
- `fechtunek [+-]\d+`
- `inicjatywa [+-]\d+`
- `refleks [+-]\d+`
- Itp.

## Wartości Domyślne

```json
{
  "offense": {
    "amount": 1,
    "grade": 1,
    "bonus": 0,
    "critical": {
      "power": 0,
      "range": 0
    }
  },
  "damageBonus": {
    "amount": 0,
    "grade": 1,
    "bonus": 0
  }
}
```

## Uwagi

1. **grade** - zawsze połowa wartości kości (k6 = 3, k8 = 4, etc.)
2. **damageBonus.amount** - dla zwykłych broni zawsze 0 (kości dmg są rzadkie)
3. **damageBonus.grade** - zawsze 1 (defaultDiceGrade)
4. **description** - wszystkie modyfikatory niestandardowe (fechtunek, inicjatywa, etc.)
5. **critical.range** - ujemne wartości oznaczają ZMNIEJSZENIE zakresu krytyka
6. **critical.power** - może być ujemny (zmniejszenie siły krytyka)
