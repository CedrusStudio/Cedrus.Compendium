# Plan Rozbudowy Aplikacji (AI-Driven Refactoring & Features)

> **Wskazówka dla AI:** Realizuj zadania w podanej kolejności. Każdy punkt zawiera kontekst, zakres zmian oraz kryteria akceptacji (Acceptance Criteria). Pisz czysty, typowany kod (np. TypeScript) i zachowaj spójność z istniejącym architekturą.

---

## Faza 1: Szybkie Poprawki UI / UX (Quick Wins)

### Task 1.1: Ikonka "Uniwersum Cedrus" (Vercel)
* **Opis:** Dodanie ikonki/wskaźnika statusu Vercel pod nagłówkiem/sekcją "Uniwersum Cedrus".
* **Kryteria Akceptacji:**
  - Ikonka jest dyskretna, estetyczna i spójna z design systemem.
  - Prawidłowo wskazuje powiązanie ze środowiskiem Vercel (np. odpowiedni SVG/lub status z Vercel API).

---

## Faza 2: Rozbudowa Mechanik Postaci i UI

### Task 2.1: Tymczasowe bonusy do rzutów w Umiejętnościach
* **Opis:** Rozbudowa karty postaci w sekcji Umiejętności o możliwość nakładania tymczasowych modyfikatorów/bonusów do rzutów (spójnie z mechanizmem istniejącym przy Cechach i Atrybutach).
* **Kryteria Akceptacji:**
  - Dodany interfejs/input do wprowadzania tymczasowego bonusu przy danej umiejętności.
  - Modyfikator uwzględnia się w całkowitym wyniku rzutu/testu danej umiejętności.
  - Stan tymczasowy jest łatwo mierzalny i możliwy do zresetowania/usunięcia.

### Task 2.2: Lokalne filtrowanie w Ekwipunku
* **Opis:** Dodanie wyszukiwarki/filtra w zakładce ekwipunku postaci do szybkiego filtrowania przedmiotów bez ponownego pobierania danych z serwera.
* **Kryteria Akceptacji:**
  - Instant search/filtering po nazwie, typie lub kategoria przedmiotu.
  - Filtrowanie odbywa się po stronie klienta (client-side state).

### Task 2.3: Ulepszenie UI Wzmocnień (Buffów/Debuffów)
* **Opis:** Czytelniejsza prezentacja aktywnych efektów i ulepszenie wyglądu sekcji wzmocnień.
* **Kryteria Akceptacji:**
  - Wyraźne oznaczenie, jakie wartości/statystyki są aktualnie modyfikowane przez dane wzmocnienie.
  - Odświeżony, bardziej przejrzysty widok listy wzmocnień (np. lepszy kontrast, czytelne ikony/etykiety).

### Task 2.4: Optymalizacja UI Zakładki Postać (Handling długich opisów)
* **Opis:** Poprawa czytelności karty postaci, ze szczególnym uwzględnieniem bardzo długich tekstów opisowych.
* **Kryteria Akceptacji:**
  - Długie opisy nie psują layoutu (zastosowanie sekcji, zwijania/rozwijania "Show more", zakładek lub modali).
  - Wprowadzenie podziału opisu na logiczne sekcje/kategorie, jeśli to możliwe.

---

## Faza 3: System Prywatnych Elementów (Custom Content)

### Task 3.1: Prywatne atuty, manewry, stany, postawy i zaklęcia
* **Opis:** Umożliwienie graczom/mistrzom gry tworzenia własnych, unikalnych elementów (na wzór istniejących prywatnych postaci).
* **Kryteria Akceptacji:**
  - Flaga `isPrivate` / `ownerId` dla obiektów typu: Atut, Manewr, Stan, Postawa, Zaklęcie.
  - Elementy prywatne są widoczne tylko dla ich twórcy (lub w ramach wybranej sesji/kampanii).
  - UI umożliwiający tworzenie, edycję i usuwanie własnych elementów.

---

## Faza 4: Dedykowane Ulepszenia UI Walki

### Task 4.1: Przebudowa UI Walki w Widoku Postaci
* **Opis:** Zwiększenie ergonomii i czytelności interfejsu podczas trwania starcia/walki.
* **Kryteria Akceptacji:**
  - Najważniejsze akcje bojowe (punkty życia, zasoby, rzuty, szybkie akcje) są łatwo dostępne.
  - Zmniejszenie przeładowania informacyjnego – priorytetyzacja danych kluczowych w walce.

### Task 4.2: Powiązanie Stanów/Postaw ze Wzmocnieniami + Szybki Przycisk
* **Opis:** Integracja Stanów i Postaw w zakładce Walka z systemem Wzmocnień.
* **Kryteria Akceptacji:**
  - Stany i Postawy wykazują relację z odpowiadającymi im wzmocnieniami.
  - Dodany nieagresywny UI/przycisk (np. mała ikonka "+"), pozwalający natychmiast utworzyć/nałożyć odpowiednie wzmocnienie z poziomu widoku walki.

---

## Faza 5: Przeprojektowanie Systemu Wymagań (Core Refactoring)

> **Uwaga dla AI:** Jest to kluczowa modyfikacja architektoniczna. Zwróć szczególną uwagę na kompatybilność wsteczną.

### Task 5.1: Model Danych Nowego Systemu Wymagań
* **Opis:** Zmiana typu danych Wymagań (Requirements) na dwa warianty:
  1. **Bez rangi (`RanklessRequirement`):** Zwykły znormalizowany string.
  2. **Z rangą (`RankedRequirement`):** Obiekt posiadający `targetKey` (sformatowany string) oraz `value` (liczba).
* **Klucz Wymagania Z Rangą (`targetKey`) może wskazywać na:**
  - Nazwę: Manewru, Postawy, Stanu, Zaklęcia, Atutu.
  - Nazwę: Cechy (np. *Siła*, *Zręczność*), Atrybutu (np. *Fechtunek*, *Wytrwałość*).

### Task 5.2: Walidacja i Logika Sprawdzania Wymagań (Mechanika)
* **Opis:** Stworzenie silnika porównującego parametry postaci z wymaganiami przedmiotu/atutu.
* **Kryteria Akceptacji:**
  - Zaimplementowana porównywarka (np. jeśli Wymaganie = `Siła: 3`, a Postać ma `Siła: 5`, funkcja zwraca `true`, ponieważ `5 >= 3`).
  - Integracja walidatora i normalizatora stringów dla wymagań bez rangi.

### Task 5.3: UI Pickera Wymagań (Editor UX)
* **Opis:** Stworzenie komponowalnego komponentu UI do dodawania i edycji wymagań.
* **Kryteria Akceptacji:**
  - Dedykowany Picker przy tworzeniu/edycji obiektów z wymaganiami.
  - Możliwość wyboru z listy istniejących w systemie: Cech, Atrybutów, Manewrów, Postaw, Stanów, Zaklęć, Atutów.
  - Automatyczne przełączanie trybu: z rangą (wartość liczbowa) vs bez rangi (custom tekst).

### Task 5.4: Migracja i Sugestie Mapowania Starych Wymagań
* **Opis:** Zarządzanie istniejącymi wymaganiami oraz przygotowanie narzędzi do ich migracji.
* **Kryteria Akceptacji:**
  - Wszystkie dotychczasowe wymagania pozostają w systemie jako wariant *Bez rangi (Custom string)* – zero regresji.
  - Stworzenie panelu/komponentu UI (dla admina/twórcy) sugerującego mapowanie starych tekstów na nowe wymagania ustrukturyzowane (np. rozszerzenie edycji z podpowiedziami autouzupełniania).