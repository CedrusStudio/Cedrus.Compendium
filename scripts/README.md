# 📚 Rulebook Synchronization Script

Skrypt do automatycznej synchronizacji pliku `rulebook-complete.json` z indywidualnych plików kategorii.

## 🎯 Cel

Gdy edytujesz pliki kategorii (np. `podstawy.json`, `cechy-i-umiejetnosci.json`), musisz zaktualizować również `rulebook-complete.json`. Ten skrypt robi to automatycznie.

## 🚀 Użycie

### Metoda 1: NPM Script (Zalecana)
```bash
npm run sync-rulebook
```

### Metoda 2: Bezpośrednie uruchomienie
```bash
npx tsx scripts/sync-rulebook.ts
```

## 📁 Struktura Plików

```
public/data/rulebook/
├── rulebook-complete.json       ← WYGENEROWANY przez skrypt
├── podstawy.json                 ← EDYTUJ ręcznie
├── cechy-i-umiejetnosci.json    ← EDYTUJ ręcznie
├── system-walki.json             ← EDYTUJ ręcznie
├── magia-i-zaklecia.json         ← EDYTUJ ręcznie
└── zdrowie-i-regeneracja.json   ← EDYTUJ ręcznie
```

## 🔄 Workflow

### Gdy dodajesz/edytujesz sekcję:

1. **Edytuj plik kategorii** (np. `podstawy.json`):
   ```json
   {
     "category": { ... },
     "sections": [
       {
         "id": "section-podstawy-nowa-sekcja",
         "title": "Nowa Sekcja",
         ...
       }
     ]
   }
   ```

2. **Uruchom synchronizację**:
   ```bash
   npm run sync-rulebook
   ```

3. **Rezultat**: `rulebook-complete.json` zostanie automatycznie zaktualizowany z:
   - Wszystkimi sekcjami ze wszystkich kategorii
   - Zaktualizowaną strukturą nawigacji
   - Nowym timestampem `lastUpdated`

## 📊 Co robi skrypt?

1. **Wczytuje** wszystkie 5 plików kategorii
2. **Agreguje**:
   - `categories`: Lista wszystkich kategorii
   - `sections`: Wszystkie 93+ sekcje
   - `navigation`: Hierarchiczna struktura nawigacji
3. **Generuje** `rulebook-complete.json` z:
   - Posortowanymi kategoriami (według `order`)
   - Wszystkimi sekcjami
   - Automatycznie wygenerowaną nawigacją
   - Aktualnym timestampem

## 🛡️ Bezpieczeństwo

Skrypt **NIE MODYFIKUJE** plików kategorii - tylko czyta z nich i generuje `rulebook-complete.json`.

## 📝 Output Example

```
🔄 Starting rulebook synchronization...

📖 Reading: podstawy.json
   ✅ Loaded 14 sections from podstawy
📖 Reading: cechy-i-umiejetnosci.json
   ✅ Loaded 29 sections from cechy-i-umiejetnosci
📖 Reading: system-walki.json
   ✅ Loaded 32 sections from system-walki
📖 Reading: magia-i-zaklecia.json
   ✅ Loaded 6 sections from magia-i-zaklecia
📖 Reading: zdrowie-i-regeneracja.json
   ✅ Loaded 12 sections from zdrowie-i-regeneracja

📊 Summary:
   - Categories: 5
   - Sections: 93

💾 Writing to: rulebook-complete.json
✅ Successfully generated rulebook-complete.json
   - File size: 183.65 KB
   - Last updated: 2025-11-11T13:33:48.203Z

✨ Synchronization complete!
```

## ⚠️ Kiedy uruchamiać?

Uruchom skrypt **po każdej zmianie** w plikach kategorii:
- ✅ Dodanie nowej sekcji
- ✅ Edycja istniejącej sekcji
- ✅ Zmiana kolejności sekcji (`order`)
- ✅ Aktualizacja metadanych kategorii
- ✅ Usunięcie sekcji

## 🔧 Troubleshooting

### Problem: "File not found"
**Rozwiązanie**: Upewnij się, że wszystkie 5 plików kategorii istnieją w `public/data/rulebook/`

### Problem: "Error parsing JSON"
**Rozwiązanie**: Sprawdź poprawność składni JSON w plikach kategorii

### Problem: "Permission denied"
**Rozwiązanie**: Upewnij się, że masz prawa zapisu do `public/data/rulebook/`

## 🎓 Best Practices

1. **Zawsze** uruchamiaj skrypt po edycji plików kategorii
2. **Commituj** zarówno pliki kategorii jak i `rulebook-complete.json` jednocześnie
3. **Nie edytuj** ręcznie `rulebook-complete.json` - zawsze używaj skryptu
4. Możesz dodać skrypt do **pre-commit hook** dla automatycznej synchronizacji

## 📚 Kod Używa:

### `rulebook-complete.json`:
- Strona główna `/rulebook`
- Wyszukiwarka `/rulebook/search`
- Command palette (Ctrl+K)
- Lista wszystkich kategorii

### Pliki kategorii (`{category}.json`):
- Lista sekcji kategorii `/rulebook/[category]`
- Szczegóły sekcji `/rulebook/[category]/[slug]`

Oba są potrzebne dla pełnej funkcjonalności!
