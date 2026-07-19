# Combat Lab

## Opis projektu

Combat Lab to moduł analityczny służący do projektowania, balansowania i testowania autorskiego systemu RPG.

Nie jest to aplikacja do prowadzenia walki.

Jej celem jest umożliwienie projektowania mechanik podobnie jak robią to studia tworzące gry komputerowe.

System powinien pozwalać odpowiedzieć na pytania:

- Czy ta postać jest za silna?
- Czy ten manewr jest opłacalny?
- Czy dana klasa ma słabe matchupy?
- Jak zmieni się balans po zwiększeniu obrażeń o 1?
- Czy istnieją zbyt mocne kombinacje umiejętności?
- Jakie statystyki dominują metę?

Całość działa deterministycznie.

AI nie jest wymagane.

---

# Cele

- Automatyczne testowanie balansu
- Symulacja walk
- Analiza statystyk
- Analiza ekonomii akcji
- Wykrywanie problemów z balansem
- Projektowanie nowych manewrów
- Wizualizacja siły postaci
- Wykrywanie synergii

---

# Technologie

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table
- React Hook Form
- Zod
- Recharts
- Framer Motion
- React Flow
- Sonner

---

## Backend

ASP.NET 9

- Minimal API
- Background Services
- Parallel Processing

---

## Dane

SQLite

lub

PostgreSQL

Encje:

- Characters
- Classes
- Weapons
- Armor
- Maneuvers
- Effects
- Talents
- Skills
- Buffs
- Debuffs
- Simulations
- Results

---

# Architektura

```
Characters

Weapons

Armor

Talents

Maneuvers

↓

Combat Engine

↓

Simulation Engine

↓

Statistics Engine

↓

Balance Analyzer

↓

Visualization
```

---

# Moduły

## Character Builder

Tworzenie postaci.

Parametry:

- Statystyki
- Umiejętności
- Broń
- Pancerz
- Talenty
- Manewry
- Efekty

---

## Combat Engine

Najważniejszy moduł.

Realizuje pełną logikę walki.

Obsługuje:

- inicjatywę
- AP
- trafienia
- obrażenia
- pancerz
- uniki
- blok
- efekty
- warunki
- kolejność tur

Silnik nie posiada UI.

Jest biblioteką wykorzystywaną przez wszystkie moduły.

---

## Simulation Engine

Uruchamia tysiące walk.

Przykład:

```
Knight

vs

Orc

↓

100 000 walk
```

Wyniki:

- Win Rate
- Średnia długość walki
- Średnie HP
- Najczęstsza przyczyna śmierci
- Najczęściej używany manewr

---

## Balance Analyzer

Porównuje postacie.

Analizuje:

- obrażenia
- przeżywalność
- mobilność
- kontrolę
- ekonomię akcji
- utility

Tworzy ranking.

---

## Matchup Analyzer

Generuje macierz pojedynków.

```
Knight

vs

Mage

65%

Knight

vs

Assassin

42%

Knight

vs

Archer

51%
```

Możliwość wygenerowania heatmapy.

---

## Maneuver Analyzer

Analiza pojedynczych manewrów.

Pokazuje:

- koszt
- średnie obrażenia
- skuteczność
- użyteczność
- średni wpływ na walkę

Wylicza:

Efficiency Score

---

## Economy Analyzer

Analizuje:

- Damage / AP
- Damage / Mana
- Damage / Turn
- Healing / AP
- Buff Value
- Debuff Value

Pokazuje czy koszt umiejętności jest uzasadniony.

---

## Combo Analyzer

Buduje graf synergii.

Przykład:

```
Bleeding

↓

Execution

↓

Critical Bonus

↓

Double Damage
```

Pokazuje:

- najczęstsze kombinacje
- najpotężniejsze kombinacje
- kombinacje nieopłacalne

---

## Synergy Analyzer

Analizuje współdziałanie:

- talentów
- broni
- manewrów
- efektów

Buduje graf zależności.

---

## Progression Analyzer

Symuluje rozwój postaci.

Po każdym poziomie:

- wzrost siły
- wzrost obrażeń
- wzrost przeżywalności
- zmiana Win Rate

Pozwala wykryć nagłe skoki mocy.

---

## Probability Explorer

Interaktywny kalkulator.

Zmiana jednej wartości natychmiast pokazuje wpływ na:

- trafienie
- obrażenia
- Win Rate
- długość walki
- AP Efficiency

---

## Rules Validator

Sprawdza:

- nieskończone kombinacje
- konflikty zasad
- nieosiągalne warunki
- zapętlone efekty
- martwe mechaniki

---

## Meta Analyzer

Po zakończeniu symulacji pokazuje:

- najlepsze klasy
- najlepsze buildy
- najgorsze buildy
- najczęściej używane manewry
- nigdy niewybierane talenty
- dominujące strategie

---

## Statistics

Wykresy:

- Win Rate
- Damage Distribution
- Healing Distribution
- AP Usage
- Critical Hits
- Dodge Rate
- Armor Efficiency
- Average Turns

---

## Combat Replay

Możliwość obejrzenia przebiegu pojedynczej symulacji.

Pokazuje:

- kolejność tur
- użyte manewry
- obrażenia
- rzuty
- efekty

Możliwość przewijania tura po turze.

---

## Scenario Builder

Tworzenie scenariuszy.

Przykłady:

- Arena
- Korytarz
- Las
- Walka grupowa
- Boss
- Oblężenie

Każdy scenariusz może wpływać na balans.

---

## Parameter Tuning

Możliwość zmiany parametrów systemu.

Przykłady:

```
Siła

12

↓

13
```

Natychmiast przeliczane są:

- Win Rate
- Damage
- Time To Kill
- Power Rating

---

# Model manewrów

Każdy manewr powinien być zapisany jako dane.

Nie jako tekst.

Przykład:

```yaml
name: Shield Bash

cost:
  ap: 2

requirements:
  weapon: shield

effects:
  - type: damage
    value: 5

  - type: push
    distance: 2

  - type: stagger
    chance: 35

cooldown: 1

tags:
  - melee
  - control
```

Opis dla gracza może być generowany automatycznie z danych.

Dzięki temu silnik potrafi analizować mechanikę.

---

# Layout aplikacji

```
┌───────────────────────────────────────────────────────────┐
│ Toolbar                                                   │
├───────────────┬───────────────────────────────────────────┤
│ Sidebar       │ Main Content                              │
│               │                                           │
│ Dashboard     │                                           │
│ Characters    │                                           │
│ Maneuvers     │                                           │
│ Talents       │                                           │
│ Simulations   │                                           │
│ Balance       │                                           │
│ Matchups      │                                           │
│ Statistics    │                                           │
│ Graphs        │                                           │
│ Settings      │                                           │
├───────────────┴───────────────────────────────────────────┤
│ Status Bar                                                │
└───────────────────────────────────────────────────────────┘
```

---

# Roadmap

## v0.1

- Combat Engine
- Character Builder
- Simulation Engine
- Combat Replay

---

## v0.2

- Balance Analyzer
- Matchup Analyzer
- Statistics

---

## v0.3

- Combo Analyzer
- Synergy Analyzer
- Probability Explorer

---

## v0.4

- Scenario Builder
- Rules Validator
- Parameter Tuning

---

## v1.0

- Meta Analyzer
- Raporty
- Eksport PDF
- Eksport CSV
- Plugin System

---

# Możliwe rozszerzenia

- Import postaci z aplikacji do prowadzenia sesji
- Eksport raportów do Markdown
- Historia zmian balansu
- Porównanie dwóch wersji zasad
- Testowanie zmian przed publikacją nowej wersji systemu
- Automatyczne wykrywanie regresji balansu

---

# Cel projektu

Stworzenie profesjonalnego środowiska do projektowania i balansowania autorskiego systemu RPG, opartego na symulacjach, analizie danych i algorytmach, a nie na intuicji. Dzięki temu każda zmiana zasad może zostać zweryfikowana na tysiącach symulowanych walk jeszcze przed wykorzystaniem jej podczas sesji.