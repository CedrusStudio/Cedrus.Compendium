# Plan funkcjonalności: Import elementów z innej postaci podczas edycji postaci

## Cel

Umożliwienie użytkownikowi importowania wybranych elementów z innej postaci podczas edycji aktualnej postaci, bez konieczności ręcznego tworzenia tych samych danych.

Funkcjonalność ma obejmować:

- Manewry
- Atuty
- Postawy
- Stany
- Zaklęcia
- Ekwipunek

Import powinien pozwalać na wybór wyłącznie wybranych elementów, a nie kopiować całej kategorii.

---

# User Story

**Jako** użytkownik edytujący postać,

**chcę** móc zaimportować wybrane elementy z innej postaci,

**aby** szybko tworzyć nowe postacie bazujące na już istniejących, bez konieczności ponownego dodawania tych samych danych.

---

# Zakres funkcjonalny

Dla każdej sekcji:

- Manewry
- Atuty
- Postawy
- Stany
- Zaklęcia
- Ekwipunek

pojawi się nowy przycisk:

> **Importuj z innej postaci**

---

# Przepływ użytkownika

## 1. Edycja postaci

Użytkownik edytuje postać **Wojak**.

Przechodzi do zakładki **Manewry**.

Obok przycisku **Dodaj manewr** znajduje się nowy przycisk:

> **Importuj z innej postaci**

---

## 2. Wybór postaci źródłowej

Po kliknięciu otwierane jest okno dialogowe.

Wyświetlana jest lista wszystkich postaci.

Przykład:

- Wojownik
- Rycerz Miecznik
- Mag Ognia
- Łucznik

Po wybraniu **Rycerz Miecznik** następuje przejście do kolejnego kroku.

---

## 3. Wyświetlenie elementów

System pobiera wszystkie manewry wybranej postaci.

Wyświetlana jest lista:

- ☐ Atak z doskoku
- ☐ Tarcza
- ☐ Kontratak
- ☐ Rozbrojenie
- ☐ Szarża

Każdy element posiada checkbox.

Dodatkowe opcje:

- Zaznacz wszystko
- Odznacz wszystko
- Wyszukiwarka
- Licznik zaznaczonych elementów

---

## 4. Import

Po kliknięciu przycisku **Importuj zaznaczone** system kopiuje wybrane elementy do aktualnie edytowanej postaci.

Przykład:

**Postać docelowa:** Wojak

**Wybrane manewry:**

- Atak z doskoku
- Kontratak
- Szarża

Po zamknięciu okna lista manewrów Wojaka zostaje automatycznie odświeżona.

---

# Zachowanie dla pozostałych sekcji

Ten sam mechanizm obowiązuje dla:

## Atuty

Wyświetlana jest lista atutów wybranej postaci.

Importowane są wyłącznie zaznaczone elementy.

## Postawy

Wyświetlana jest lista postaw wybranej postaci.

Importowane są wyłącznie zaznaczone elementy.

## Stany

Wyświetlana jest lista stanów wybranej postaci.

Importowane są wyłącznie zaznaczone elementy.

## Zaklęcia

Wyświetlana jest lista zaklęć wybranej postaci.

Importowane są wyłącznie zaznaczone elementy.

## Ekwipunek

Wyświetlana jest lista przedmiotów wybranej postaci.

Importowane są wyłącznie zaznaczone elementy.

---

# Obsługa duplikatów

Przed wykonaniem importu system powinien sprawdzić, czy dany element już istnieje na edytowanej postaci.

## Rekomendowane zachowanie

Duplikaty nie są importowane.

Po zakończeniu operacji wyświetlany jest komunikat, np.:

> Zaimportowano **5** elementów. Pominięto **2** elementy, ponieważ już istnieją na tej postaci.

---

# Wymagania UX

Okno importu powinno zawierać:

- nazwę aktualnie edytowanej postaci,
- nazwę postaci źródłowej,
- wyszukiwarkę elementów,
- opcję **Zaznacz wszystko**,
- licznik zaznaczonych elementów,
- przycisk **Importuj**,
- przycisk **Anuluj**.

---

# Wymagania techniczne

## Backend

Dla każdej kategorii system powinien umożliwiać:

- pobranie listy elementów przypisanych do wskazanej postaci,
- skopiowanie wybranych elementów do innej postaci,
- walidację duplikatów,
- zwrócenie informacji o:
  - liczbie zaimportowanych elementów,
  - liczbie pominiętych elementów,
  - ewentualnych błędach.

## Frontend

Dialog importu powinien być wspólnym komponentem wykorzystywanym przez wszystkie kategorie.

Konfigurowane powinny być jedynie:

- typ importowanych danych (manewry, atuty, postawy, stany, zaklęcia, ekwipunek),
- źródło danych,
- sposób prezentacji elementów (jeśli różni się pomiędzy kategoriami).

Dzięki temu możliwe będzie wykorzystanie jednego, uniwersalnego komponentu do obsługi wszystkich typów importu.

---

# Kryteria akceptacji

- [ ] Użytkownik może uruchomić import dla każdej obsługiwanej kategorii.
- [ ] Może wybrać postać źródłową.
- [ ] System wyświetla listę elementów przypisanych do wybranej postaci.
- [ ] Możliwe jest zaznaczenie dowolnej liczby elementów.
- [ ] Importowane są wyłącznie zaznaczone elementy.
- [ ] Lista elementów aktualnie edytowanej postaci odświeża się po zakończeniu importu.
- [ ] System poprawnie obsługuje duplikaty.
- [ ] Po zakończeniu operacji użytkownik otrzymuje podsumowanie liczby zaimportowanych i pominiętych elementów.

---

# Możliwe rozszerzenia

- Import wielu kategorii jednocześnie.
- Filtrowanie postaci źródłowych według systemu, klasy lub szablonu.
- Podgląd szczegółów elementów przed importem.
- Nadpisywanie istniejących elementów po potwierdzeniu przez użytkownika.
- Zapamiętywanie ostatnio wybranej postaci źródłowej.
- Możliwość importu z szablonów postaci, a nie tylko z istniejących postaci.