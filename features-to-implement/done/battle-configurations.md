# Implementacja presetów konfiguracji bitwy (Battle Presets) – Plan funkcjonalny v1

## Cel biznesowy

Użytkownik powinien mieć możliwość zapisania kompletnej konfiguracji bitwy jako gotowego presetu przypisanego do konkretnego API Key.

Dzięki temu będzie mógł:

- szybko odtworzyć wcześniej przygotowaną bitwę,
- przechowywać wiele konfiguracji,
- modyfikować zapisane konfiguracje,
- usuwać konfiguracje,
- zarządzać nimi z poziomu personalizacji,
- wykorzystywać je bezpośrednio z poziomu widoku bitwy.

---

# Problem do rozwiązania

Obecnie użytkownik za każdym razem musi ręcznie:

- wybierać postacie,
- ustawiać drużyny,
- ustawiać przeciwników,
- konfigurować układ bitwy.

Przy częstych testach jest to czasochłonne i niewygodne.

---

# Definicja Battle Preset

Battle Preset jest zapisaną konfiguracją bitwy przypisaną do konkretnego API Key.

Przykład:

```json
{
  "id": "preset_001",
  "name": "Boss Fight Setup",
  "apiKey": "abc123",
  "configuration": {
    "allies": [...],
    "enemies": [...],
    "battleSettings": {...}
  }
}
```

---

# Zakres MVP

## Użytkownik może

### Tworzyć preset

Przykład:

```text
Nazwa:
Raid Test Setup

Konfiguracja:
- Tank
- Healer
- Mage

Przeciwnicy:
- Dragon
- Dragonling
```

---

### Wczytywać preset

Z listy:

```text
[ Raid Test Setup ]
[ PvP Setup ]
[ Boss Test ]
```

Po wybraniu:

```text
Konfiguracja bitwy zostaje odtworzona.
```

---

### Aktualizować preset

Przykład:

```text
Dodano nową postać
Zmieniono skład drużyny
```

Następnie:

```text
Zapisz zmiany
```

---

### Usuwać preset

Przykład:

```text
Usuń preset
```

---

### Nadpisywać preset

Przykład:

```text
Załaduj preset
Zmodyfikuj skład
Zapisz
```

---

# Model danych

## Nowa encja

### BattlePreset

```ts
type BattlePreset = {
    id: string;
    name: string;
    apiKey: string;
    configuration: BattleConfiguration;
    createdAt: Date;
    updatedAt: Date;
}
```

---

## BattleConfiguration

Powinna przechowywać wszystko co jest wymagane do pełnego odtworzenia bitwy.

Przykład:

```ts
type BattleConfiguration = {
    allies: string[];
    enemies: string[];
    settings?: {
        rounds?: number;
        difficulty?: string;
    };
}
```

Finalny zakres należy dostosować do obecnego modelu Battle.

---

# Prisma

## Nowy model

```prisma
model BattlePreset {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  apiKey        String

  configuration Json

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

# Dlaczego Json

Konfiguracja bitwy może ewoluować.

Przykład:

Dzisiaj:

```json
{
  "allies": [],
  "enemies": []
}
```

Za pół roku:

```json
{
  "allies": [],
  "enemies": [],
  "arena": {},
  "rules": {}
}
```

Brak konieczności migracji modelu.

---

# Widok bitwy (Battle View)

## Nowy panel

### Battle Presets

```text
────────────────────
Battle Presets

[▼ Raid Test Setup]

[Load]
[Save Current]
[Save As]
[Delete]
────────────────────
```

---

# Funkcjonalność Load

Po kliknięciu:

```text
Load
```

System:

1. Pobiera preset.
2. Czyści aktualny setup.
3. Odtwarza konfigurację.

---

# Funkcjonalność Save Current

Jeżeli preset jest załadowany:

```text
Save Current
```

Nadpisuje aktualny preset.

---

# Funkcjonalność Save As

Pozwala stworzyć nowy preset.

Przykład:

```text
Preset Name:
Boss Fight v2

[Save]
```

---

# Funkcjonalność Delete

Przykład:

```text
Delete Preset

Are you sure?

[Yes]
[No]
```

---

# Personalizacja (Settings)

## Nowa sekcja

```text
Settings

└── Battle Presets
```

---

# Widok zarządzania presetami

Lista:

```text
Boss Fight Setup
PvP Setup
Raid Test

[Edit]
[Delete]
```

---

# Edycja presetu

Możliwość:

- zmiany nazwy,
- podejrzenia konfiguracji,
- usunięcia,
- zapisania zmian.

---

# Ograniczenie do API Key

Każdy preset należy wyłącznie do jednego API Key.

Przykład:

```text
API Key A
 ├── Boss Setup
 ├── Raid Setup

API Key B
 ├── PvP Setup
```

Użytkownik nie widzi presetów innych użytkowników.

---

# Filtrowanie w bazie

Wszystkie zapytania muszą być filtrowane po:

```ts
where: {
    apiKey: currentApiKey
}
```

Nie filtrować po stronie klienta.

---

# Endpointy API

## Pobranie presetów

```http
GET /api/battle-presets
```

---

## Pobranie pojedynczego presetu

```http
GET /api/battle-presets/{id}
```

---

## Utworzenie

```http
POST /api/battle-presets
```

---

## Aktualizacja

```http
PUT /api/battle-presets/{id}
```

---

## Usunięcie

```http
DELETE /api/battle-presets/{id}
```

---

# Warstwa domenowa

Nowy katalog:

```text
src/domain/battlePresets
```

Przykład:

```text
src/domain/battlePresets
 ├── BattlePreset.ts
 ├── BattleConfiguration.ts
```

---

# Persistence

Nowy katalog:

```text
src/persistence/battlePresets
```

Przykład:

```text
src/persistence/battlePresets
 ├── battlePresetsRepository.ts
 ├── battlePresetMapping.ts
```

---

# Application

Nowy moduł:

```text
src/application/battlePresets
```

Przykład:

```text
src/application/battlePresets
 ├── hooks
 ├── components
 ├── views
```

---

# React Query

## Query Keys

```ts
[
  "battle-presets",
  apiKey
]
```

---

## Invalidacja

Po:

- utworzeniu,
- aktualizacji,
- usunięciu

wykonać:

```ts
queryClient.invalidateQueries({
  queryKey: ["battle-presets"]
});
```

---

# Testy

## Test 1

Tworzenie presetu.

Oczekiwany wynik:

```text
Preset zapisany.
```

---

## Test 2

Wczytanie presetu.

Oczekiwany wynik:

```text
Bitwa odtworzona.
```

---

## Test 3

Aktualizacja presetu.

Oczekiwany wynik:

```text
Zmiany zapisane.
```

---

## Test 4

Usunięcie presetu.

Oczekiwany wynik:

```text
Preset usunięty.
```

---

## Test 5

API Key A nie widzi presetów API Key B.

Oczekiwany wynik:

```text
Brak dostępu.
```

---

## Test 6

Zmiana API Key.

Oczekiwany wynik:

```text
Lista presetów odświeżona.
```

---

# Podwójna weryfikacja przed implementacją

## Weryfikacja 1 – zakres konfiguracji

Przed implementacją należy ustalić:

Jakie elementy dokładnie składają się na konfigurację bitwy?

Przykładowo:

- postacie,
- kolejność,
- przeciwnicy,
- arena,
- buffy,
- ustawienia walki,
- inne parametry.

To determinuje strukturę `BattleConfiguration`.

---

## Weryfikacja 2 – źródło API Key

Potwierdzić:

```ts
useApiKey()
```

jest jedynym źródłem klucza wykorzystywanym przez Battle View oraz Settings.

---

## Weryfikacja 3 – maksymalna liczba presetów

Ustalić:

- brak limitu,
- limit 50,
- limit 100.

Rekomendacja:

```text
100 presetów na API Key
```

---

# Rekomendacja architektoniczna

Najbezpieczniejsze rozwiązanie:

- osobna encja `BattlePreset`,
- konfiguracja przechowywana jako JSON,
- filtrowanie wyłącznie po stronie bazy,
- wspólny moduł wykorzystywany przez Battle View oraz Settings,
- React Query z API-Key-aware cache keys,
- pełne CRUD dla presetów.

Dzięki temu funkcjonalność będzie łatwa do rozbudowy o przyszłe elementy, takie jak:
- udostępnianie presetów,
- import/export presetów,
- oznaczanie ulubionych presetów,
- wersjonowanie konfiguracji bitwy.