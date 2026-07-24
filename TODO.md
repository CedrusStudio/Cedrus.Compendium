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

# Plan Rozbudowy i Poprawek: Combat Lab & Kompendium

> **Wskazówka dla AI:** Realizuj zadania Fazy 1 (Analiza i Zapewnienie Jakości) przed przystąpieniem do refaktoryzacji UI i mechanik. Zachowaj spójność nazewnictwa oraz typowania w aplikacji.

---

## Faza 1: Analiza Architektury i Weryfikacja Logiki (Diagnostyka)

### Task 1.1: Analiza i usunięcie zaszłości po "Manie"
* **Kontekst:** W sekcji *Startowa pula zasobów (na symulację)* widnieje pole "Mana", mimo że system operuje wyłącznie na "Esencji".
* **Zadanie dla AI:**
  - Przeanalizuj bazę kodu pod kątem obecności pola `mana` / `Mana`.
  - Ustalić, skąd wzięła się ta wartość (czy to zaszłość po starym szablonie/innym systemie, czy błędnie nazwany zasób).
  - Bezpiecznie zrefaktoryzuj lub usuń odwołania do Many, upewniając się, że cała logika operuje wyłącznie na Esencji.

### Task 1.2: Weryfikacja przeliczania statystyk z Postaw/Stanów (Rulebook Check)
* **Kontekst:** Trzeba sprawdzić, czy bonusy z modyfikatorów (np. *Wir Walki* zwiększający Siłę) poprawnie przeliczają się na statystyki pochodne, takie jak Obrażenia.
* **Zadanie dla AI:**
  - Przeanalizuj silnik przeliczania statystyk w Combat Lab pod kątem kolejności kalkulacji (zgodnie z podręcznikiem zasad / rulebookiem).
  - Upewnij się, że modyfikator do cechy podstawowej (np. +Siła) automatycznie aktualizuje bazowe Obrażenia oraz inne statystyki z niej wynikające przed uruchomieniem symulacji.

---

## Faza 2: Nawigacja i Layout Ogólny (App-Wide UI)

### Task 2.1: Przywrócenie paska nawigacji w Combat Lab
* **Opis:** W widoku Combat Lab brakuje górnego paska nawigacyjnego, co uniemożliwia wygodny powrót do reszty aplikacji.
* **Kryteria Akceptacji:**
  - Górny pasek nawigacyjny (Main Navbar/Header) jest obecny i spójny również w widoku Combat Lab.

### Task 2.2: Reorganizacja kafelków na Stronie Głównym (Grid Layout)
* **Opis:** Poprawa układu 5 kart na stronie głównej (Postacie, Bestiariusz, Kompendium, Podręcznik, Combat Lab), aby uniknąć osamotnionego kafelka w drugim wierszu (układ 4+1).
* **Kryteria Akceptacji:**
  - Przebudowany Responsive Grid (np. 3+2 na desktopie lub inny, estetyczny layout z wyróżnionym Combat Lab/Podręcznikiem).

---

## Faza 3: Dedykowane Poprawki UI / UX w Combat Lab

### Task 3.1: Filtrowanie Postaw i Stanów według wybranej postaci
* **Opis:** Przy wyborze Postawy/Stanu w Combat Lab użytkownik widzi pełną listę wszystkich dostępnych opcji, co utrudnia wybór.
* **Kryteria Akceptacji:**
  - Dodana możliwość przełączenia widoku/filtrowania, aby wyświetlić tylko te Postawy i Stany, które wybrana postać faktycznie posiada na swojej karcie.

### Task 3.2: Czyszczenie etykiet i micro-UI w selektorach
* **Opis:** Usunięcie zbędnych ciągów tekstowych oraz poprawa przycisków akcji.
* **Kryteria Akceptacji:**
  - Usunięto tekst `"g3"` z widoku wybranej postawy (informacja o randze jest już przekazywana przez `"ranga 3"` w selekcie).
  - Zamieniono tekstowy przycisk usuwania `"x"` na czytelną ikonę (np. `TrashIcon` lub `XIcon` z biblioteki ikon).
  - Skrócono nazwy we Wzmocnieniach Tymczasowych:
    - `"Obrażenia (płaskie)"` $\rightarrow$ `"Obrażenia"`
    - `"Niewrażliwość (usuwa kości)"` $\rightarrow$ `"Niewrażliwość"`

### Task 3.3: Redesign i czytelność panelu "Podgląd Statystyk"
* **Opis:** Odświeżenie wizualne sekcji statystyk w Combat Lab oraz uzupełnienie brakujących danych.
* **Kryteria Akceptacji:**
  - Poprawione formatowanie w sekcji Tryby: zamiana zapisu (np. `"Postawa Defensywna g2"` $\rightarrow$ `"Postawa Defensywna 2"`).
  - Wyświetlanie brakujących Atrybutów: *Fechtunek*, *Fortel* oraz pozostałych kluczowych parametrów.
  - W sekcji Obrona dodana **suma całkowitej redukcji** (zsumowane wartości: Blok + Parowanie + Unik + Pancerz).
  - Uproszczony i czytelniejszy zapis Ataku: usunięty słowny przerywnik `+bonus` (np. zamiast `2(k10+2) +bonus 1k6+5` formatowanie jest bardziej zwarte i spójne).

---

## Faza 4: Ulepszenia Kompendium i Tworzenia Elementów

### Task 4.1: Sekcja Efektów przy tworzeniu Nowego Manewru
* **Opis:** Brak możliwości definiowania/dodawania efektów podczas formularza tworzenia nowego manewru.
* **Kryteria Akceptacji:**
  - Formularz dodawania/edycji manewru został rozbudowany o sekcję zarządzania efektami.

### Task 4.2: Optymalizacja przypiętego panelu w Kompendium (Sticky Header & Tags)
* **Opis:** Przypięty u góry panel w kompendium zajmuje zbyt dużo miejsca w pionie, gdy zawiera dużo tagów.
* **Kryteria Akceptacji:**
  - Dodana opcja zwijania/rozwijania sekcji tagów (Collapsible Tags) lub kompaktowy tryb wyświetlania paska u góry podczas przewijania.

### Task 4.3: Masowe zaznaczanie tagów wykluczających
* **Opis:** Brak opcji szybkiego zaznaczenia wszystkich filtrów wykluczających.
* **Kryteria Akceptacji:**
  - Dodany przycisk "Zaznacz wszystkie" / "Odznacz wszystkie" przy filtrach/tagach wykluczających (szybka personalizacja).

### Task 4.4: Skrócenie etykiety Mapowania Efektów
* **Opis:** Tekst `"Efekty (Combat Lab): do zmapowania"` jest zbyt długi i przytłacza widok.
* **Kryteria Akceptacji:**
  - Zmieniono etykietę na zwarto: `"Efekty: do zmapowania"`.

---

## Faza 5: Zaawansowane Mechaniki i Wyszukiwanie Cross-Ref

### Task 5.1: Obsługa złożonych modyfikatorów obrażeń (Kości Broni)
* **Opis:** Rozbudowa silnika symulacji o zaawansowane warunki modyfikowania obrażeń dodawanych per kość broni.
* **Przykład:** *Zapał Wojownika 1* dodaje $+1$ obrażenie do każdej kości broni oraz dodatkowe obrażenia zależne od liczby kości.
* **Kryteria Akceptacji:**
  - Dodano obsługę reguł zwiększających obrażenia w przeliczeniu na pojedynczą kość broni (`damage_per_weapon_dice`).
  - Rozszerzono kalkulator Combat Lab o uwzględnianie niestandardowych warunków modyfikacji kości obrażeń.

### Task 5.2: Wyszukiwanie powiązań w Kompendium (Reverse Lookup / Cross-Reference)
* **Opis:** Stworzenie nowej funkcjonalności pozwalającej sprawdzić, które postacie posiadają dany element z kompendium.
* **Kryteria Akceptacji:**
  - W widoku szczegółów danego elementu w Kompendium (Manewr, Postawa, Stan, Atut, Zaklęcie, Moc, Przedmiot itp.) znajduje się sekcja/przycisk **"Posiadane przez postacie"**.
  - Wyświetlana jest lista postaci graczy/NPC, które mają ten element na swojej karcie, z możliwością szybkiego przejścia do widoku danej postaci.