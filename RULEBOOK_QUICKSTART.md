# Quick Start - Podręcznik Cedrus

## 🚀 Szybki Start

### Dostęp do Podręcznika

Podręcznik Cedrus jest dostępny pod adresem:
- **Główna strona:** `/rulebook`
- **Wyszukiwarka:** `/rulebook/search`

### Uruchomienie Konwersji

Jeśli zmieniłeś pliki Markdown:

```bash
npx tsx scripts/convert-rulebook.ts
```

### Struktura URL

```
/rulebook                                    # Strona główna
/rulebook/search                             # Wyszukiwarka
/rulebook/[category]                         # Lista sekcji
/rulebook/[category]/[slug]                  # Szczegóły sekcji
```

## 📁 Struktura Danych

### Lokalizacja Plików JSON

```
public/data/rulebook/
├── rulebook-complete.json           # Wszystkie dane
├── podstawy.json                    # 14 sekcji
├── cechy-i-umiejetnosci.json       # 29 sekcji
├── system-walki.json                # 32 sekcje
├── magia-i-zaklecia.json            # 6 sekcji
└── zdrowie-i-regeneracja.json       # 12 sekcji
```

### Lokalizacja Źródeł

```
rulebook-data/
├── 01-Podstawy/
├── 02-Cechy-i-Umiejętności/
├── 03-System-Walki/
├── 04-Magia-i-Zaklęcia/
└── 05-Zdrowie-i-Regeneracja/
```

## 🔧 Komponenty

### Application Layer

```typescript
// Renderowanie sekcji
<RulebookSectionView section={section} />

// Karta kategorii
<CategoryCard category={category} sectionCount={10} />

// Sidebar nawigacji
<RulebookSidebar navigation={navigation} />

// Spis treści
<TableOfContents section={section} />

// Renderowanie bloku treści
<ContentBlockRenderer block={contentBlock} />

// Tabela
<RulebookTable table={tableData} />
```

### Hooks

```typescript
// Client-side hooks
import {
  useRulebookData,
  useCategorySections,
  useRulebookSection,
  useRulebookNavigation,
  useRulebookCategories,
  useRulebookSearch
} from '@/infrastructure/hooks/useRulebook';

// Przykład użycia
const { data: section, isLoading } = useRulebookSection('podstawy', 'rodzaje-kosci');
```

### Server-side Loading

```typescript
// Server-side functions
import {
  loadRulebookData,
  loadCategorySections,
  loadSection,
  loadAllSections,
  loadNavigation,
  loadCategories,
  searchSections
} from '@/persistence/rulebook/rulebookLoader';

// Przykład użycia
const section = loadSection('podstawy', 'rodzaje-kosci');
```

## 📊 Statystyki

- **Sekcje:** 93
- **Kategorie:** 5
- **Komponenty:** 8
- **Static pages:** 98
- **Czas konwersji:** ~2s

## 🎯 Kategorie

1. **Podstawy** (`podstawy`) - 14 sekcji
   - Mechaniki bazowe, testy, kości, obrażenia

2. **Cechy i Umiejętności** (`cechy-i-umiejetnosci`) - 29 sekcji
   - Atrybuty, umiejętności bojowe, obronne, nadnaturalne

3. **System Walki** (`system-walki`) - 32 sekcje
   - Mechanika, style, taktyka, organizacja walki

4. **Magia i Zaklęcia** (`magia-i-zaklecia`) - 6 sekcji
   - Czarowanie, łańcuchy zaklęć, siła zaklęć

5. **Zdrowie i Regeneracja** (`zdrowie-i-regeneracja`) - 12 sekcji
   - Leczenie, regeneracja esencji, efekty krytyczne

## ✨ Features

✅ Static Site Generation (SSG)  
✅ Pełnotekstowe wyszukiwanie  
✅ Filtrowanie po kategorii  
✅ Sidebar z nawigacją  
✅ Table of Contents z active state  
✅ Responsive design  
✅ Dark mode support  
✅ TypeScript strict mode  

## 📝 Przykłady

### Dodanie Nowej Sekcji

1. Utwórz plik `.md` w odpowiednim katalogu `rulebook-data/`
2. Uruchom `npx tsx scripts/convert-rulebook.ts`
3. Restart dev server (jeśli potrzebny)

### Edycja Istniejącej Sekcji

1. Edytuj plik `.md`
2. Uruchom konwersję
3. Odśwież przeglądarkę

## 🐛 Troubleshooting

### Problem: JSON nie aktualizuje się

**Rozwiązanie:** Usuń katalog `public/data/rulebook/` i uruchom ponownie konwersję

### Problem: Strona 404

**Rozwiązanie:** Sprawdź czy:
- JSON files istnieją w `public/data/rulebook/`
- Slug jest poprawny (lowercase, bez polskich znaków)
- Dev server został zrestartowany

### Problem: Błędy TypeScript

**Rozwiązanie:** Sprawdź zgodność typów w `RulebookTypes.ts`

---

**Dokumentacja:** `RULEBOOK_IMPLEMENTATION.md`  
**Autor:** GitHub Copilot  
**Data:** 11 listopada 2025
