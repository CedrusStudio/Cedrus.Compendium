# Plan implementacji: generowanie wersji roboczej postaci przez AI

Stan: wdrożone i używane. Zweryfikowany względem repozytorium 2026-08-03.

## Stan wdrożenia 2026-08-03

Funkcja działa end-to-end na prawdziwym kompendium. Poniższa sekcja opisuje, co
zmieniło się względem pierwotnego planu w trakcie pierwszych realnych generacji —
prawie wszystkie te zmiany wynikły z konkretnych, powtarzalnych wad w wynikach,
a nie z przewidywań.

### Kontekst dla modelu urósł z niczego do trzech źródeł

`buildCharacterGenerationContext` zwracał `allowedCatalog: not-configured`
z pustą listą. Model nigdy nie widział ani jednego manewru, przedmiotu czy rasy,
więc **musiał** wymyślać wszystko, o co go poproszono. Dziś kontekst niesie:

- **katalog kompendium** (`aiCharacterCatalogRepository` → `toAiCharacterCatalog`)
  ze wszystkich 12 rodzajów wpisów, z rangą, ceną, tagami, tekstem wymagań,
  polem `replaces` i — dla ekwipunku, wierzchowców i ras — ich własnymi
  liczbami pod kluczem `statistics`. Bez nich model zgadywał pulę ataku broni,
  której statystyk nigdy nie zobaczył, i zgadywał nisko;
- **fragmenty podręcznika** (`aiCharacterRulebookContext`) dobrane tym samym
  scoringiem, z doważeniem sekcji o kosztach i rangach;
- **profile balansu** (`buildBalanceProfiles`) — patrz osobna sekcja niżej.

### Dobór katalogu: cztery reguły, każda z konkretnego błędu

Całe kompendium to 584 tysiące znaków przy limicie kontekstu 120 000, więc
`selectCatalogEntries` musi wybierać. Kolejne reguły powstały tak:

1. **Dopasowanie po rdzeniu, nie po słowie.** Opis mówi „fintowaniu", manewr
   nazywa się „Finta" — wspólnych słów zero. Próg to cztery znaki wspólnego
   prefiksu.
2. **Rotacja po rodzajach.** Dobór w globalnej kolejności punktów dawał
   992 manewrom przewagę nad 214 postawami; model dostawał cztery postawy.
   Rodzaje biorą po kolei.
3. **Limit rang na nazwę.** „Postawa Miecznika" cztery razy to nie cztery opcje.
   Dwie rangi, chyba że inny wpis żąda konkretnej rangi po nazwie.
4. **Przypięcia i wymagania.** Wpisy niesione przez postacie referencyjne wchodzą
   bezwarunkowo — inaczej instrukcja „naśladuj referencje" była niewykonalna,
   bo „Postawa Defensywna" nie dzieli rdzenia z opisem o mieczu. Drugi przebieg
   dociąga wpisy, których żądają wpisy już wybrane, z 15% budżetu zarezerwowanego
   właśnie na to: „Większy Fechtunek" ma score 0 wobec opisu o fortelu, a „Garda"
   go wymaga.

### Identyfikatory: model myli 26 znaków

Trzy osobne mechanizmy, bo trzy osobne tryby awarii:

- **Wpisy własne draftu** (talenty, obrony, ofensywy, profile wzmocnień) —
  model podaje krótki placeholder, serwer nadaje ULID i przepina referencje
  (`defaultDefenseId`, `active*Ids`). Mapa jest per kolekcja, więc ten sam
  placeholder dla broni i zbroi to nadal dwa wpisy.
- **Wpisy z kompendium** — identyfikator porównywany z nazwą obok niego.
  Zdarzyło się, że model podpisał wpis „Nagła Zasłona", a wkleił identyfikator
  manewru „Wyrównanie": prawdziwy ULID, obecny w katalogu, więc przechodził
  wszystkie testy i podłączyłby postaci nie ten manewr. **Nazwa ma pierwszeństwo**
  — `buildCatalogIdentityIndex` pozwala odtworzyć id z nazwy i rangi.
- **Referencje globalne** (rasa, zaklęcia, specyfikacje mocy) — nietykane, żeby
  walidacja akceptacji mogła zgłosić halucynację zamiast cicho ją przepisać.

### Weryfikacja wymagań

`validateAiCharacterProposalRequirements` przepuszcza każdy atut, manewr,
postawę, stan i zaklęcie przez `checkRequirement` — ten sam silnik co reszta
aplikacji, więc obsługuje `ranked`, `sum`, `count`, `anyOf` i `rankless`.
Wymagania strukturalne wczytywane są osobno (`loadAiCharacterRequirements`)
i **nie trafiają do promptu**: model dostaje je jako gotowe zdanie, które już ma
na wpisie, a wysyłanie obu form płaciłoby dwa razy za tę samą informację.

Zgodnie z decyzją zapisaną w nagłówku `checkRequirement.ts` (Marek, 2026-07-25)
ta warstwa **raportuje i nigdy nie blokuje** — prowadzący ma prawo świadomie dać
postaci coś, na co formalnie jej nie stać.

## Poziom siły i balans

`buildBalanceProfiles` mierzy istniejące postacie i podaje modelowi skalę.
Powód: instrukcja „specjalność ma być wyższa niż zwykłe wyszkolenie" dała fortel
3 przy fechtunku 6 i model nazwał to wyjątkowym talentem — 3 to mediana dla tagu,
który sam wybrał.

Profil liczony jest **per tag postaci**, nie globalnie:

```
wojak (48 postaci)        mediana   p90
  fechtunek                  3       8
  fortel                     3       7
  walka wręcz                4       8
  najwyższy atrybut          6       8   (max 9)
  manewrów                  11      15
  atutów                     0       6
```

Podział po tagach jest konieczny, bo w kolekcji postaci siedzą potwory: globalnie
najwyższy atrybut sięga 16, a wojak kończy na 9. Model dostający skalę globalną
budowałby każdego żołnierza jak smoka.

Instrukcja mówi, gdzie się na tej skali umieścić: zwykłe wyszkolenie przy
medianie, specjalność przy p90 albo maksimum, rzecz niewspomniana w opisie na
medianie lub niżej.

**Próg**: tag musi mieć co najmniej 8 postaci, inaczej percentyle opisują dwa
rekordy i błąd zaokrąglenia. Przy tym progu z bazy powstaje 12 profili; do
kontekstu lecą maksymalnie trzy, najliczniejsze najpierw, po ~900 znaków każdy.

**Świadome ograniczenie.** To jest opis **stanu faktycznego bazy**, a nie
intencji projektowej. Jeśli w kompendium siedzą postacie niedopracowane, profil
je uśrednia i AI będzie do nich ciągnąć. Ręcznie pisana tabela poziomów mocy
(rekrut / weteran / mistrz) pozostaje otwartą opcją — świadomie odłożona, bo
liczone profile nie wymagają utrzymania i nie wietrzeją.

### Czego prompt nie umie i nie powinien udawać

Kilka reguł w instrukcji istnieje wyłącznie dlatego, że model potrafi wyciągnąć
z nich zły wniosek:

- **Atuty nie modyfikują statystyk.** Zakaz wpisywania efektów atutów do
  `testBonus` sprawił, że model zaczął je *odejmować* od bazy („fortel 8 przed
  efektami atutów" → wpisane 3). W tej aplikacji nie ma żadnego powiązania
  atut → statystyka; liczba w polu to liczba, którą postać ma.
- **Jedna ranga na wpis.** `checkRequirement` porównuje z najwyższą posiadaną
  rangą, a żadna z 215 postaci nie trzyma dwóch rang jednego atutu.
- **`grade` to szczebel drabinki kości, nie rozmiar.** Grade 5 to k10.
- **Zestawy walki to nie wpisy katalogu.** Reguła „przy wpisie z katalogu liczy
  się id, resztę wypełnij zerami" wyciekła na `combat.offenses` i dała
  miecznikowi pulę `0k1`.

## Stan wdrożenia 2026-08-02

Zaimplementowano i przetestowano lokalnie:

- kontrakty Zod, modele Prisma dla draftów i limitów oraz twardą rezerwację budżetu;
- BFF wymagający `x-api-key`, redakcję danych referencyjnych i źródło referencji z MongoDB;
- OpenAI Responses API dla `gpt-5.6-luna`, Structured Outputs, limit odpowiedzi i rozliczenie tokenów;
- tryb „Generuj z AI” przy tworzeniu postaci: opis, do trzech referencji, podgląd, ostrzeżenia, odrzucanie i ponowne generowanie;
- atomowe, idempotentne zatwierdzenie draftu do postaci z ponowną walidacją i ochroną przed wymyślonymi wpisami kompendium;
- adapter Ollama korzystający z tego samego kontraktu, podglądu i końcowej walidacji.

Przed pierwszym użyciem pozostają kroki operacyjne:

1. zastosować modele Prisma w MongoDB przez `npx prisma db push`;
2. ustawić w lokalnym `.env` `AI_CHARACTER_GENERATION_ENABLED=true`;
3. wykonać jeden jawny, mały test z prawdziwym API OpenAI i sprawdzić utworzony draft;
4. dopiero po pozytywnym teście korzystać z generowania w zwykłej pracy.

Następne rozszerzenia, nieblokujące MVP, to kuratorowany katalog elementów kompendium, źródło backupów działające wyłącznie lokalnie oraz widok historii/metryk zużycia.

## Cel

Użytkownik opisuje po polsku postać, opcjonalnie wybiera do trzech istniejących postaci jako referencje, a aplikacja tworzy kompletną, edytowalną wersję roboczą. Wersja robocza jest pokazywana w podglądzie wraz z uzasadnieniem i ostrzeżeniami. Dopiero świadome zatwierdzenie użytkownika zapisuje postać w MongoDB.

Priorytetem jest provider OpenAI API. Architektura od pierwszego kroku musi jednak pozwalać później podłączyć lokalny model przez Ollama, bez zmiany ekranu generowania, formatu wersji roboczej i procesu zatwierdzania.

Poza zakresem MVP:

- automatyczne publikowanie nowych manewrów, perków, zaklęć lub postaw do globalnego kompendium;
- automatyczne zapisanie postaci bez podglądu i zatwierdzenia;
- wysyłanie pełnych backupów do modelu;
- udostępnienie kosztownego endpointu anonimowemu użytkownikowi.

## Najważniejsze decyzje

### Generujemy propozycję, nie rekord bazy

Model nie dostaje prawa do wywołania repozytorium ani dostępu do bazy. Zwraca wyłącznie dane o kształcie AiCharacterProposal. Serwer waliduje je przez Zod i reguły domenowe, a interfejs prezentuje je jako draft.

Zapis następuje wyłącznie przez osobny endpoint akceptacji. Ten endpoint ponownie waliduje wersję roboczą i zapisuje pełną postać w jednej transakcji. Nie wolno wykonywać sekwencji: utwórz pustą postać, zapisz część danych, a potem liczyć na powodzenie kolejnych aktualizacji.

### BFF jest jedyną bramą między UI, lokalnymi danymi i modelem

Przeglądarka ani model nie dostają dostępu do lokalnego systemu plików. UI woła wyłącznie backend aplikacji Next.js, czyli BFF (Backend for Frontend), przez POST /api/ai/character-drafts. Dopiero BFF odczytuje dopuszczone dane, buduje kontekst, pilnuje budżetu i wywołuje wybranego providera.

    Przeglądarka
         │ opis + maks. 3 ID referencji
         ▼
    Next.js BFF /api/ai/character-drafts
         │ odczyt + filtrowanie + redakcja
         ├────────────► MongoDB / bieżące postaci
         ├────────────► lokalny backup (wyłącznie opcjonalne źródło serwerowe)
         │
         │ wyłącznie skrócony kontekst bez sekretów
         ▼
    OpenAI API albo lokalny Ollama

Adres C:\Users\Marek\source\repos\Cedurs\Cedrus.Compendium\backup nie może być parametrem wysyłanym przez klienta, nie może być przekazany modelowi i nie może być wystawiony jako publiczny endpoint do pobierania plików. W aplikacji wdrożonej na zdalnym serwerze taki lokalny katalog użytkownika w ogóle nie istnieje; w lokalnym uruchomieniu może go czytać wyłącznie proces BFF działający na tym samym komputerze.

### Źródłem referencji jest aktualna baza; backup jest kontrolowanym fallbackiem developerskim

Najnowszy backup zawiera 215 rekordów Character, ale komplet postaci jest rozbity między Character.json i kolekcje relacyjne, np. Maneuver.json, Perk.json, Spell.json oraz ekwipunek. Nie można potraktować pojedynczego rekordu z Character.json jako kompletnego szablonu.

Domyślna ścieżka produkcyjna BFF pobiera referencje z MongoDB, ponieważ zawiera bieżący stan i już ma modele relacji używane przez aplikację. Backup jest przydatny do ręcznego testowania, budowy fixture’ów oraz opcjonalnego lokalnego trybu offline.

W ścieżce z bieżącą bazą BFF ma:

1. pobrać wskazane postaci z bieżącej bazy razem z relacjami;
2. sprawdzić ich widoczność względem x-api-key wywołującego;
3. zbudować z nich skrócony, kontrolowany kontekst;
4. usunąć apiKeys, wewnętrzne identyfikatory niepotrzebne modelowi i pola niewchodzące do zadania.

W szczególności nie wolno przekazywać do providera OPENAI_API_KEY, NEXT_API_KEYS ani pola Character.apiKeys.

Jeżeli po MVP będzie potrzebne generowanie z backupu, dodać osobny BackupCharacterGenerationContextSource uruchamiany wyłącznie po stronie BFF:

- ma akceptować tylko identyfikator snapshotu z listy katalogów pod backup, nigdy ścieżkę absolutną od klienta;
- ma ładować komplet relacyjnych plików wybranego snapshotu i łączyć je po ID;
- ma być chroniony tym samym x-api-key i filtrem danych, co źródło MongoDB;
- ma ignorować pola apiKeys oraz nigdy nie zwracać surowych plików do przeglądarki;
- ma być domyślnie wyłączony poza lokalnym środowiskiem developerskim.

Na potrzeby MVP nie trzeba implementować tego źródła: produkcyjna baza jest poprawniejszym źródłem referencji, a BFF i kontrakt context source należy od początku zaprojektować tak, aby backup dało się dodać jako drugi adapter.

### Najpierw OpenAI API, ale przez abstrakcję providera

Subskrypcja ChatGPT/Codex i rozliczenie API są odrębne. Do wbudowanej funkcji potrzebny jest serwerowy klucz API oraz osobne rozliczanie użycia. Źródło: [OpenAI Help: ChatGPT subscription and API billing](https://help.openai.com/en/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api).

Implementacja nie może importować klienta OpenAI bezpośrednio do komponentu ani trasy UI. Ma korzystać z interfejsu CharacterGenerationProvider. Pierwszą implementacją będzie OpenAiCharacterGenerationProvider, a drugą, w późniejszym etapie, OllamaCharacterGenerationProvider.

### Budżet aplikacji jest twardy; budżet projektu OpenAI jest tylko dodatkową ochroną

W API Platform warto utworzyć osobny projekt Cedrus Compendium, ograniczyć dozwolone modele i ustawić alerty budżetowe, np. 50%, 80% i 100%. Projektowy Monthly budget jest jednak progiem powiadomień, nie gwarantowanym zatrzymaniem zapytań po przekroczeniu. Źródło: [OpenAI Help: managing API projects](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform).

Dlatego funkcja wdraża własny, twardy limit po stronie aplikacji: rezerwuje maksymalny koszt przed zapytaniem i odmawia wykonania, jeżeli rezerwacja przekracza limit dzienny, miesięczny lub limit liczby generowań. To jest mechanizm, który realnie chroni przed przypadkowym wydatkiem.

Jako dodatkowy bezpiecznik właściciel może korzystać z doładowania prepaid z wyłączonym auto-recharge. Rozliczenie providerów może mieć niewielkie opóźnienie, więc prepaid nie zastępuje limitu aplikacji. Źródło: [OpenAI Help: prepaid billing](https://help.openai.com/en/articles/8264644-manage-your-chatgpt-subscription).

## Stan obecnego repo i punkty integracji

| Obszar | Stan obecny | Konsekwencja dla planu |
|---|---|---|
| Tworzenie postaci | AddCharacterView ma tryby od zera i z szablonu. | Dodać trzeci tryb: Generuj z AI. |
| Zapis postaci | POST /api/characters tworzy tylko nagłówek, a szczegóły idą oddzielnymi PUT. | Dodać osobny, transakcyjny zapis zaakceptowanego draftu. |
| Kopiowanie | copyCreateCharacter potrafi podłączyć relacje istniejącego wzoru. | Użyć jako inspiracji, ale nie jako ścieżki zapisu draftu AI. |
| Walidacja | Istnieją schematy Zod dla szczegółów, statystyk, talentów, ekwipunku, walki i buffów. | Złożyć je w jeden schemat proposal oraz drugi schemat zapisu. |
| Prisma/MongoDB | Character ma zagnieżdżone obiekty i relacje do kompendium oraz ekwipunku. | Nie budować dokumentu na skróty; referencje muszą istnieć przy zatwierdzeniu. |
| Tożsamość | Aplikacja używa x-api-key i NEXT_API_KEYS do kontroli prywatności. | Endpoint AI wymaga prawidłowego klucza; koszt przypisujemy do jego hasha. |
| Zależności | package.json nie zawiera jeszcze SDK OpenAI. | Dodać pakiet openai dopiero w etapie OpenAI. |

## Docelowy przepływ użytkownika

1. Użytkownik otwiera dodawanie postaci i wybiera Generuj z AI.
2. Wpisuje opis oraz opcjonalne ograniczenia, np. poziom trudności, styl walki, zakazane elementy i język nazewnictwa.
3. Wybiera od zera do trzech widocznych postaci referencyjnych. Wyszukiwarka pokazuje nazwę, tagi i skrót, nie pełny JSON.
4. Kliknięcie Generuj najpierw rezerwuje budżet. Gdy limit jest wyczerpany, nie następuje wywołanie providera.
5. Serwer tworzy kontekst, woła provider i zapisuje niezatwierdzony AiCharacterDraft.
6. Użytkownik widzi podgląd: opis, statystyki, obrona, ofensywa, zdrowie, talenty, ekwipunek, moce, wybrane elementy kompendium, ostrzeżenia oraz zwięzłe uzasadnienie.
7. Użytkownik może zmienić dane w podglądzie, odrzucić draft, wygenerować nową wersję albo zatwierdzić.
8. Zatwierdzenie ponownie sprawdza wszystkie dane i tworzy postać atomowo. Po sukcesie użytkownik przechodzi do zwykłej strony edycji nowej postaci.

W MVP edycja draftu odbywa się w dedykowanym podglądzie prostych pól. Przycisk Otwórz w pełnym edytorze może zostać dodany później; nie może powodować częściowego zapisu do bazy.

## Kontrakt danych

### Wejście endpointu generowania

Proponowany payload POST /api/ai/character-drafts:

    {
      "description": "Doświadczony zwiadowca z magią lodu, walczy z dystansu.",
      "referenceCharacterIds": ["01..."],
      "constraints": {
        "language": "pl-PL",
        "notes": "Bez ciężkiego pancerza; klimat północny."
      }
    }

Ograniczenia serwera:

- opis po trim musi mieć ustaloną długość minimalną i maksymalną;
- referenceCharacterIds zawiera od 0 do 3 różnych ULID-ów;
- tylko postaci widoczne dla bieżącego x-api-key mogą wejść do kontekstu;
- constraints to niewielka, walidowana mapa pól, nie dowolny JSON;
- limit wielkości każdego pola broni zarówno budżetu, jak i endpointu.

### AiCharacterProposal

Proposal jest czystym kontraktem aplikacji, a nie surowym typem Prisma Character. Powinien zawierać:

- header: name, shortName, description, tags, opcjonalne raceId;
- statistics: characteristics, attributes, health i talents;
- combat: defenses, defaultDefenseId, offenses, defaultOffenseId, stances, states, maneuvers, powers i zależne spells/power specifications;
- equipment: weapons, armors, shields, inventory i mounts;
- details: perks i profile buffów;
- reference ids tylko dla istniejących elementów kompendium;
- explanation: krótkie, czytelne uzasadnienie konstrukcji;
- warnings: lista ograniczeń, których model nie mógł spełnić lub które wymagają kontroli człowieka.

Nieobecne pola znaczą nie zaproponowano, a nie domyślna wartość. Funkcja normalizeProposal uzupełnia bezpieczne domyślne wartości po walidacji, a przed podglądem.

### Polityka elementów istniejących i nowych

MVP rozdziela typy danych:

| Rodzaj | Co model może zrobić w MVP |
|---|---|
| Rasa, manewr, postawa, stan, perk, zaklęcie, specification mocy | Wybrać wyłącznie identyfikator z katalogu przekazanego przez serwer. |
| Ekwipunek postaci, obrona, ofensywa, talenty, profile buffów | Zaproponować nowy element zgodny ze schematem postaci. |
| Globalne kompendium | Nie tworzyć ani nie modyfikować. |

Takie rozdzielenie eliminuje sytuację, w której model wymyśla identyfikator lub nieistniejący globalny manewr. Osobny pomysł na generowanie nowych pozycji kompendium może później dostać swój workflow z niezależnym przeglądem.

### Walidacja wielowarstwowa

Po odpowiedzi providera, a ponownie przed zapisem:

1. walidacja ścisłym schematem Zod AiCharacterProposal;
2. uzupełnienie domyślnych wartości przez funkcje domenowe, nie przez model;
3. walidacja istniejącymi schematami DetailsDto, StatisticsDto, TalentsDto, EquipmentDto, CombatDto i BuffsDto;
4. sprawdzenie każdego referencjonowanego ID w bazie oraz jego widoczności;
5. sprawdzenie unikalności name i shortName;
6. sprawdzenie spójności defaultDefenseId/defaultOffenseId z tablicami oraz powiązań power ↔ spell ↔ power specification;
7. kontrola własnych limitów gry, gdy zostaną zdefiniowane;
8. odrzucenie pola apiKeys i wszystkich nieznanych pól.

Błąd walidacji ma dać draft ze statusem invalid oraz listą diagnostyczną dla UI. Nie może tworzyć rekordu Character.

## Warstwa providera

### Interfejs

Plik: src/domain/ai-character-generation/CharacterGenerationProvider.ts

    export interface CharacterGenerationProvider {
      generate(input: CharacterGenerationProviderInput): Promise<CharacterGenerationProviderResult>;
    }

Input zawiera znormalizowany opis, bezpieczny kontekst referencji, katalog elementów, reguły i wersję promptu. Result zawiera raw proposal, model, provider, usage input/output tokens oraz ewentualne id requestu providera.

Interfejs nie może znać komponentów React, Prisma ani NextRequest.

### OpenAI API — etap pierwszy

Pliki:

- src/infrastructure/ai/openai/OpenAiCharacterGenerationProvider.ts;
- src/infrastructure/ai/createCharacterGenerationProvider.ts;
- src/lib/env.ts;

Dołączyć oficjalne SDK openai tylko po zatwierdzeniu implementacji etapu. Klucz OPENAI_API_KEY istnieje wyłącznie w środowisku serwera; nie używać prefiksu NEXT_PUBLIC_ i nie zwracać go w API.

Provider wymusza odpowiedź JSON Schema/Structured Outputs, używając schematu pochodzącego z kontraktu proposal. Przed wysłaniem ustawia ograniczenie długości odpowiedzi. Wytyczne OpenAI dla odpowiedzi schema JSON opisują ten mechanizm w [API reference](https://platform.openai.com/docs/api-reference/responses-streaming/response/content_part).

System prompt musi:

- opisać rolę jako generator wersji roboczej Cedrus, nie jako autonomiczny administrator;
- traktować opis użytkownika i opisy referencji jako dane, a nie instrukcje wyższego priorytetu;
- zabraniać tworzenia elementów globalnego kompendium;
- nakazać zwrócenie wyłącznie kontraktu proposal;
- prosić o warnings przy niepewności zamiast wymyślania danych;
- nie zawierać sekretów, apiKeys, nazw zmiennych środowiskowych ani całego backupu.

Nie pokazywać użytkownikowi ukrytego rozumowania modelu. Pole explanation ma być krótkim uzasadnieniem napisanym do pokazania w UI.

### Lokalny provider Ollama — etap późniejszy

Provider lokalny implementuje dokładnie ten sam interfejs oraz zwraca ten sam proposal. Konfiguracja:

    AI_CHARACTER_PROVIDER=ollama
    OLLAMA_BASE_URL=http://127.0.0.1:11434
    OLLAMA_MODEL=<wybrany-model>

Zasady:

- endpoint 127.0.0.1 jest poprawny dla uruchomienia aplikacji i modelu na tym samym komputerze;
- po wdrożeniu aplikacji na zdalny serwer adres localhost oznacza serwer, nie przeglądarkę użytkownika; lokalnego modelu nie da się wtedy bezpiecznie użyć bez współlokacji albo osobnej, uwierzytelnionej bramy;
- UI nie powinno pozwalać nieuprawnionemu użytkownikowi na dowolny adres provider URL;
- lokalny provider nadal przechodzi identyczną walidację i budżet liczby żądań, chociaż jego koszt pieniężny może być ustawiony na zero;
- dla modeli lokalnych bez ścisłego JSON Schema wymagany jest parser, naprawa pojedynczego błędu formatu bez kolejnego wywołania oraz końcowa walidacja Zod. Nie wolno akceptować luźnego JSON-a po naprawie, jeśli nie przechodzi pełnej walidacji.

Etap Ollama nie wymaga zmiany endpointów, modelu draftu ani komponentów, tylko nowego adaptera i konfiguracji.

## Kontekst dla modelu

### Context builder

Nowy moduł: src/domain/ai-character-generation/buildGenerationContext.ts.

Tworzy deterministyczny i ograniczony rozmiarem kontekst:

1. z opisu użytkownika;
2. z maksymalnie trzech postaci referencyjnych;
3. z listy legalnych ras i elementów kompendium;
4. z wymaganych fragmentów podręcznika, jeżeli zostaną jednoznacznie przypisane do danego typu danych;
5. z reguł ograniczających format danych.

Kontekst referencji ma zawierać praktyczne cechy: header, tagi, statystyki, obronę, ofensywę, elementy kompendium i zwięzłe opisy. Ma nie zawierać apiKeys, technicznych identyfikatorów obiektów zagnieżdżonych ani danych niewykorzystywanych przez model.

Context builder nie czyta samodzielnie systemu plików ani nie rozmawia z Prisma. Dostaje już zweryfikowane obiekty przez interfejs CharacterGenerationContextSource. Pierwsza implementacja MongoCharacterGenerationContextSource używa repozytoriów i reguł widoczności bazy; przyszła implementacja BackupCharacterGenerationContextSource ma ten sam kontrakt, ale rozwiązuje relacje w jednym, dozwolonym lokalnym snapshotcie. Dzięki temu provider modelu pozostaje całkowicie nieświadomy, czy dane przyszły z bazy czy backupu.

Nie należy od razu dołączać całego rulebooku. Najpierw należy zbudować mały, wersjonowany katalog zasad mechanicznych potrzebnych generatorowi. W przeciwnym razie koszt i ryzyko niespójnej interpretacji będą rosły szybciej niż jakość.

### Selekcja katalogu

Pełny katalog elementów może być zbyt długi. Builder musi stosować strategię:

- zawsze wysłać ID, nazwę, rangę, tagi i zwięzły opis elementów jawnie wymaganych przez użytkownika;
- wyszukać kandydatów po tagach z opisu i referencji;
- ograniczyć wynik do ustalonego maksimum, zachowując deterministyczne sortowanie;
- oznaczyć w promptcie, że model może wybrać tylko elementy z katalogu;
- gdy brakuje odpowiedniego elementu, zwrócić warning zamiast tworzyć nowy.

W pierwszej implementacji wyszukiwanie może być proste i deterministyczne. Embeddingi/RAG nie są potrzebne do MVP; warto je rozważyć dopiero, gdy katalog będzie za duży dla tej strategii.

### Bezpieczeństwo promptu

Teksty użytkownika i opisy postaci mogą zawierać frazy przypominające instrukcje. Wstawiać je między wyraźne delimitery danych i nigdy nie używać jako instrukcji systemowych. Po stronie serwera nie udostępniać modelowi narzędzi do wykonywania zapisu, sieci ani poleceń systemowych.

## Model danych i limity kosztów

### Uwierzytelnienie endpointu AI

Nie wystarczy, że API OpenAI jest ukryte na serwerze. Każdy posiadający publiczny adres aplikacji mógłby inaczej wywołać endpoint i generować koszt.

MVP wymaga ważnego x-api-key należącego do NEXT_API_KEYS. Trasa AI:

1. odczytuje nagłówek;
2. odrzuca brakujący lub nieprawidłowy klucz kodem 401/403;
3. używa wyłącznie hasha klucza do przypisania draftów i limitów;
4. nigdy nie zapisuje klucza otwartym tekstem ani nie loguje go.

Jeżeli kiedyś dojdzie normalne logowanie użytkowników, actorScope można zastąpić userId. Kontrakt limitera nie powinien od tego zależeć.

### Tabele Prisma

Dodać do prisma/schema.prisma co najmniej dwa modele.

AiCharacterDraft:

- id, apiKeyHash, status: pending/accepted/rejected/invalid/expired;
- request: Json, znormalizowany opis i ograniczenia bez sekretów;
- proposal: Json, zawsze po walidacji albo null dla invalid;
- validationIssues: Json;
- referenceCharacterIds: String[];
- provider, model, promptVersion;
- generationUsage: Json, inputTokens, outputTokens oraz request id;
- costMicroUsd: Int;
- createdAt, updatedAt, expiresAt, acceptedAt i acceptedCharacterId;
- indeks po apiKeyHash i createdAt, indeks po expiresAt.

AiGenerationLedger:

- id, apiKeyHash, dayBucketUtc i monthBucketUtc;
- provider, model, draftId;
- state: reserved/completed/released;
- reservedMicroUsd i actualMicroUsd;
- inputTokens i outputTokens po zakończeniu;
- createdAt i updatedAt.

Kwoty przechowujemy w micro USD jako liczby całkowite, nigdy jako float. Eliminuje to błędy zaokrągleń podczas sumowania budżetu.

### Konfiguracja

W src/lib/env.ts wprowadzić osobny schema dla AI. Przykładowe zmienne:

    AI_CHARACTER_GENERATION_ENABLED=false
    AI_CHARACTER_PROVIDER=openai
    OPENAI_API_KEY=
    AI_OPENAI_MODEL=
    AI_MONTHLY_LIMIT_MICRO_USD=5000000
    AI_DAILY_LIMIT_MICRO_USD=500000
    AI_MAX_GENERATIONS_PER_DAY=5
    AI_MAX_REQUEST_COST_MICRO_USD=200000
    AI_MAX_REFERENCES=3
    AI_MAX_DESCRIPTION_CHARS=4000
    AI_DRAFT_TTL_HOURS=24

Powyższe liczby są przykładami, nie domyślną decyzją biznesową. Przed włączeniem produkcyjnym właściciel ustala rzeczywisty limit. Bez OPENAI_API_KEY lub z AI_CHARACTER_GENERATION_ENABLED=false trasy zwracają bezpieczny błąd funkcja niedostępna.

Wybrany model i jego maksymalna cena wejścia/wyjścia tworzą wersjonowany wpis w konfiguracji cen aplikacji. Przy zmianie modelu trzeba zaktualizować wpis przed włączeniem go w konfiguracji; nie wolno zakładać, że modele zawsze mają tę samą cenę.

### Twarda rezerwacja budżetu

Algorytm dla każdego płatnego providerowego wywołania:

1. odczytaj aktualne limity i policz najgorszy koszt jednego żądania jako AI_MAX_REQUEST_COST_MICRO_USD;
2. w transakcji atomowo policz sumę aktywnych rezerwacji i zakończonych użyć dla apiKeyHash w bieżącym dniu oraz miesiącu UTC;
3. jeżeli po dodaniu maksymalnego kosztu przekroczony byłby limit kosztu lub liczba generowań, zakończ przed zapytaniem kodem 429 i informacją o dacie resetu;
4. w przeciwnym razie utwórz wpis reserved na pełny maksymalny koszt;
5. wywołaj providera;
6. po powodzeniu zapisz faktyczne tokeny i actualMicroUsd, zmień status na completed i zwolnij niewykorzystaną część rezerwacji;
7. po błędzie oznacz wpis released; gdy stan połączenia jest niepewny, pozostaw pełną rezerwację do czasu bezpiecznego wygaszenia, nie zakładaj że koszt wynosi zero.

Nie implementować wzorca odczytaj-sumę-potem-zapisz bez atomowości, bo dwa równoległe kliknięcia mogą minąć limit. Przed kodowaniem sprawdzić na realnym MongoDB Atlas, czy istniejąca konfiguracja obsługuje transakcję Prisma. Jeśli nie, użyć atomowej aktualizacji licznika przez MongoDB, a nie niestabilnego cache pamięciowego.

Nawet przy limicie aplikacji klucz API powinien być projektowym kluczem o minimalnym zakresie, nie kluczem używanym w innych projektach. Wyciek klucza poza aplikację omija jej limiter; osobny projekt ogranicza zasięg szkody i pozwala natychmiast odwołać klucz.

### UI kosztu

Przed kliknięciem Generuj UI pokazuje:

- wybranego providera;
- komunikat, że generowanie może zużyć część budżetu;
- maksymalny koszt jednego wywołania lub informację o lokalnym providerze;
- pozostały budżet dzienny/miesięczny tylko dla właściciela, jeżeli jest to pożądane;
- czy budżet jest zablokowany.

Po powodzeniu można pokazać faktyczny koszt draftu w widoku historii, ale nie jest to konieczne w pierwszym ekranie podglądu.

## Endpointy i zapis

### API

| Metoda i ścieżka | Działanie |
|---|---|
| POST /api/ai/character-drafts | Waliduje wejście, rezerwuje budżet, generuje oraz zapisuje draft. |
| GET /api/ai/character-drafts/[id] | Zwraca draft widoczny tylko dla tego samego apiKeyHash. |
| POST /api/ai/character-drafts/[id]/regenerate | Tworzy nowy draft albo nową wersję; każda próba ma własną rezerwację. |
| POST /api/ai/character-drafts/[id]/accept | Ponownie waliduje i atomowo tworzy Character, zwracając ID. |
| DELETE /api/ai/character-drafts/[id] | Odrzuca draft; nie usuwa historycznego ledgeru kosztów. |

Należy ujednolicić obsługę błędów: 400 dla danych wejściowych, 401/403 dla identyfikacji, 404 dla cudzego/brakującego draftu, 409 dla konfliktu danych po wygenerowaniu, 429 dla limitu, 502 dla błędu providera i 503 dla wyłączonej integracji.

### Transakcyjna akceptacja

Nowa funkcja w src/persistence/characters/charactersRepository.ts lub wyodrębnionym module:

    createCharacterFromAiDraft(draftId, actorScope)

Ma ona:

1. odczytać draft i potwierdzić status pending oraz właściciela;
2. ponownie sprawdzić proposal i aktualne istnienie wszystkich referencji;
3. ponownie sprawdzić unikalność name/shortName;
4. stworzyć Character oraz elementy dozwolone jako własne elementy postaci;
5. podłączyć wyłącznie zweryfikowane relacje globalne;
6. oznaczyć draft accepted z acceptedCharacterId;
7. zwrócić dokładnie jeden ID.

Akceptacja musi być idempotentna: drugi klik po udanym zapisie zwraca już zapisany acceptedCharacterId, a nie tworzy duplikat. Jedna transakcja obejmuje zapis Character i zmianę statusu draftu.

Nie należy wołać publicznych endpointów POST /api/characters i potem PUT /details, /statistics, /talents, /equipment, /combat. Byłoby to nieatomowe, trudne do odtworzenia po awarii i nie zapewniałoby idempotencji.

## UI i organizacja kodu

### Nowe moduły

| Katalog/pliki | Odpowiedzialność |
|---|---|
| src/domain/ai-character-generation/ | Kontrakty, Zod, provider interface, context builder, normalizacja i walidacja niezależna od UI. |
| src/infrastructure/ai/ | Implementacje OpenAI/Ollama i fabryka providera. |
| src/persistence/ai-character-generation/ | Repozytorium draftów, ledger, limiter i mapowanie do Prisma. |
| src/infrastructure/ai/context-sources/ | Adapter MongoDB dla referencji; w przyszłości lokalny adapter backupu. |
| src/app/api/ai/character-drafts/ | Tylko trasy HTTP i mapowanie błędów na odpowiedzi. |
| src/application/characters/ai/ | Formularz opisu, wybór referencji, podgląd, diff, ostrzeżenia i przyciski akcji. |
| src/infrastructure/clients/aiCharacterDraftsClient.ts | Klient frontendowy do nowych endpointów. |

### Integracja z tworzeniem postaci

Zmodyfikować src/application/characters/add/AddCharacterView.tsx:

- rozszerzyć CharacterCreationMode o ai;
- dodać trzeci przycisk trybu z tłumaczeniami we wszystkich używanych językach;
- w trybie ai wyświetlić AiCharacterGenerationView zamiast bieżącego formularza HeaderDto;
- zachować niezależnie istniejące tryby scratch i copy bez zmiany ich zachowania.

Wyszukiwarka referencji powinna wykorzystywać istniejące wyszukiwanie postaci i reguły widoczności. Wybranie referencji nie może pobierać całego backupu na klienta.

### Podgląd i diff

Podgląd powinien zawierać małe sekcje:

- nagłówek i opis;
- charakterystyki oraz atrybuty;
- zdrowie, obronę i ofensywę;
- talenty, ekwipunek, moce i elementy kompendium;
- Co zaczerpnięto z referencji;
- Ostrzeżenia i niespełnione ograniczenia.

Gdy istnieje referencja główna, można pokazać różnice względem niej. Nie ukrywać pustych lub nietypowych pól — one są często sygnałem błędnego proposal.

Akcje:

- Wygeneruj ponownie — nowe rozliczane wywołanie;
- Odrzuć — kończy pracę z draftem bez kosztu dodatkowego;
- Zatwierdź i utwórz — uruchamia wyłącznie lokalny zapis;
- Wróć do opisu — zachowuje tekst, nie wysyła kolejnego żądania.

### Zakres edycji wersji roboczej (decyzja z Markiem, 2026-08-04)

Podgląd draftu pozwala:

- usuwać wpisy, które model przesadził;
- poprawiać wartości charakterystyk i atrybutów;
- edytować tagi — dodawać i usuwać, bo tagi decydują o tym, z jakim profilem balansu porównywana jest postać;
- **dopisywać wpisy z kompendium i podmieniać ich rangi** przez wyszukiwarkę `GET /api/ai/character-catalog?kind=…&query=…`.

Ostatni punkt odwraca wcześniejsze założenie „edycja tylko przycinaniem”. Powód jest mechaniczny: kompendium wersjonuje wpis po randze (`@@unique([name, grade])`), więc „Większy Fortel” w randze 3 i w randze 4 to dwa różne rekordy o różnych identyfikatorach. Podniesienie rangi, żeby spełnić wymaganie, jest technicznie *dodaniem* wpisu — a to była najczęstsza poprawka, jakiej wymagały recenzowane drafty. Zakaz dodawania blokował dokładnie ten przypadek.

Ranga nigdy nie jest zwykłym polem liczbowym: wybór z katalogu podmienia **cały rekord**, bo inaczej draft opisywałby postać, do której nie linkuje, a raport wymagań byłby fikcją. `validateAiCharacterProposalEdit` przepuszcza dopisany wpis wyłącznie wtedy, gdy jego identyfikator istnieje w kompendium pod właściwym rodzajem, a nazwa i ranga zgadzają się z rekordem — wymyślanie wpisów tą drogą pozostaje niemożliwe.

## Etapy realizacji

### Etap 0 — decyzje i przygotowanie bez kodu

1. Ustalić początkowy limit miesięczny, dzienny i maksymalny koszt pojedynczego żądania.
2. Utworzyć oddzielny projekt API dla Compendium, ograniczyć modele, ustawić alerty i wyłączyć auto-recharge, jeśli używany jest prepaid.
3. Ustalić, czy generowanie jest dostępne tylko dla kluczy z NEXT_API_KEYS. Rekomendacja: tak.
4. Ustalić, czy nowa postać AI jest domyślnie publiczna czy dostaje apiKeys bieżącego użytkownika. Rekomendacja dla spójności z istniejącym tworzeniem: publiczna, z możliwością zmiany w zwykłej edycji.
5. Ustalić, czy MVP ma tworzyć wyłącznie własny ekwipunek, czy także puste pozycje. Rekomendacja: na początku tworzyć tylko elementy użyteczne dla karty postaci; globalnego kompendium nie ruszać.

### Etap 1 — kontrakt, baza i limiter

1. Dodać Zod dla wejścia, proposal, draftu i akceptacji.
2. Dodać modele AiCharacterDraft i AiGenerationLedger w Prisma oraz wygenerować klienta.
3. Dodać konfigurację AI w src/lib/env.ts z bezpiecznym wyłączeniem funkcji.
4. Zaimplementować hash scope, sprawdzanie x-api-key i repozytorium draftów.
5. Zaimplementować atomową rezerwację, rozliczenie i zwalnianie kosztu.
6. Dodać testy przekroczenia limitu, limitu liczby generowań, równoległych prób i błędu połączenia.

Rezultat: istnieje bezpieczny fundament bez prawdziwego wywołania modelu.

### Etap 2 — context builder i OpenAI provider

1. Dodać kontekst referencji i katalogu z odfiltrowaniem prywatnych danych.
2. Dodać provider interface i fabrykę.
3. Dodać OpenAiCharacterGenerationProvider ze Structured Outputs.
4. Ustalić i wersjonować prompt.
5. Dodać POST generowania z rezerwacją przed requestem oraz rozliczeniem po response.
6. Testować provider mockiem; test integracyjny z prawdziwym API ma być ręczny, jawnie uruchamiany i domyślnie wyłączony.

Rezultat: backend zwraca bezpieczny draft, lecz nie ma jeszcze pełnego UI.

### Etap 3 — UI generowania i podglądu

1. Dodać tryb ai na stronie dodawania postaci.
2. Dodać formularz opisu, wybór do trzech referencji i czytelne informacje o limicie.
3. Dodać ekran ładowania, komunikaty dla 429/502/503 oraz kontrolę regeneracji.
4. Dodać podgląd proposal, diff względem głównej referencji i ostrzeżenia.
5. Dodać tłumaczenia PL/EN/DE/FR zgodnie z istniejącym systemem.

Rezultat: użytkownik widzi i ocenia wersję roboczą, ale jej zatwierdzenie może być chwilowo ukryte za feature flagą.

### Etap 4 — atomowa akceptacja i edycja

1. Zaimplementować createCharacterFromAiDraft w transakcji.
2. Dodać endpoint accept, idempotencję i ochronę przed drugim kliknięciem.
3. Po sukcesie przekierować do strony edycji utworzonej postaci.
4. Dodać historię ostatnich draftów dla tego samego apiKeyHash oraz wygasanie starych draftów.

Rezultat: pełny pionowy przepływ opis → podgląd → świadome zatwierdzenie → postać.

### Etap 5 — jakość, operacje i obserwowalność

1. Dodać widok właściciela z użyciem budżetu, liczbą generowań i możliwością diagnostyki bez treści sekretów.
2. Dodać metryki: provider, model, wynik, tokeny, actual cost i błędy walidacji.
3. Dodać kontrolowane sprzątanie draftów wygasłych oraz zwolnienie osieroconych rezerwacji.
4. Przeprowadzić testy na ręcznie wybranych backupowych przykładach, nie wysyłając pełnych plików.
5. Dopracować prompt dopiero na podstawie błędów i zaakceptowanych/odrzuconych draftów.

### Etap 6 — lokalny provider Ollama

1. Zaimplementować OllamaCharacterGenerationProvider.
2. Dodać konfigurację providerów po stronie serwera.
3. Przetestować ten sam zestaw fixture’ów i walidacji co dla OpenAI.
4. Pokazać w UI, który provider jest aktywny, ale nie ujawniać użytkownikom adresów infrastruktury.
5. Dodać instrukcję lokalnego uruchomienia jako osobny dokument, dopiero po wyborze konkretnego modelu i wymagań sprzętowych.

## Testy

### Testy jednostkowe

- schema wejścia odrzuca zbyt długi opis, więcej niż trzy referencje, duplikaty i nieznane pola;
- context builder nie przekazuje apiKeys, wewnętrznych sekretów ani niewidocznych postaci;
- parser proposal odrzuca wymyślone ID i niespójne default IDs;
- normalizacja nie zmienia semantyki świadomie podanych wartości;
- limiter rezerwuje najgorszy koszt, potem prawidłowo rozlicza faktyczny;
- równoległe żądania nie przekraczają limitu;
- błąd providera nie tworzy Character i bezpiecznie zachowuje lub zwalnia rezerwację;
- akceptacja jest idempotentna.

### Testy tras

- brak/błędny x-api-key nie może rozpocząć generowania;
- cudzy apiKeyHash nie odczyta, nie zaakceptuje ani nie odrzuci draftu;
- 429 nie woła providera;
- 409 przy kolizji nazwy po wygenerowaniu nie tworzy częściowej postaci;
- endpoint accept nie wykonuje drugiego zapisu po ponowionym żądaniu.

### Testy komponentów

- tryby scratch i copy zachowują obecne działanie;
- wybór referencji ogranicza się do trzech;
- stan loading blokuje podwójne kliknięcie;
- podgląd pokazuje warnings i nie ukrywa pola z błędem;
- komunikat budżetowy jest czytelny, a przy wyczerpaniu nie ma przycisku aktywującego API.

### Weryfikacja końcowa

1. npm run test dla nowych i dotkniętych modułów.
2. npm run typecheck.
3. npm run lint.
4. Ręczny test z wyłączoną flagą: endpoint odmawia bez providerowego wywołania.
5. Ręczny test z małym budżetem: pierwsze generowanie przechodzi, kolejne jest blokowane przed wywołaniem API.
6. Ręczny test trzech referencji z backupu odtworzonych w bazie: proposal ma wszystkie dozwolone referencje, a brakujące elementy trafiają do warnings.
7. Ręczny test akceptacji i odświeżenia strony: powstaje dokładnie jedna postać, gotowa do zwykłej edycji.
8. Ręczny test lokalnego provideru po Etapie 6 z tym samym proposal i walidacją.

## Ryzyka i sposoby ograniczenia

| Ryzyko | Ograniczenie |
|---|---|
| Nieoczekiwany koszt | Osobny projekt API, prepaid bez auto-recharge, alerty, twarda rezerwacja kosztu i limit liczby generowań. |
| Publiczne nadużycie endpointu | Wymagany x-api-key, limit per apiKeyHash, brak klucza providerowego po stronie klienta. |
| Model wymyśla dane | Structured Outputs, katalog legalnych ID, Zod i walidacja bazy przed podglądem oraz przed zapisem. |
| Częściowy zapis | Jedna transakcja akceptacji i idempotentny draft. |
| Zmiana/dowolne usunięcie danych referencyjnych po generacji | Ponowna walidacja relacji przy zatwierdzeniu. |
| Prywatne dane w promptcie | Context builder i testy redakcji; brak apiKeys i pełnych backupów. |
| Niska jakość lokalnego modelu | Ten sam schema gate; lokalny provider jest alternatywą, nie mniej rygorystyczną ścieżką. |
| Zmiana cen/modeli providera | Wersjonowana konfiguracja cen i jawna aktualizacja przed zmianą modelu. |

## Otwarte decyzje wymagające potwierdzenia przed Etapem 1

1. Jaki ma być początkowy twardy budżet miesięczny, dzienny i pojedynczego generowania?
2. Czy generator ma działać wyłącznie dla poprawnego x-api-key z NEXT_API_KEYS? Rekomendacja: tak.
3. Czy nowe postacie AI mają być domyślnie publiczne, jak dzisiejsze nowe postacie?
4. Czy przy zatwierdzaniu MVP użytkownik może tworzyć własny ekwipunek, czy tylko wybierać istniejące elementy?
5. Jaki ma być pierwszy dozwolony model OpenAI po skonfigurowaniu projektu API?
6. Czy przechowywać opis użytkownika i proposal przez 24 godziny, czy krócej/dłużej?
7. Czy historia kosztów ma być widoczna tylko w danych administracyjnych, czy także w UI użytkownika?

## Kryteria gotowości MVP

MVP jest gotowe dopiero, gdy:

- bez włączonej flagi lub bez prawidłowego x-api-key nie da się wygenerować płatnego żądania;
- użytkownik może podać opis oraz wybrać 0–3 widoczne referencje;
- odpowiedź modelu jest proposalem przechodzącym ścisłą walidację albo czytelnym błędem, nigdy częściowo zapisaną postacią;
- model nie może utworzyć globalnego elementu kompendium ani przemycić nieistniejącego ID;
- użytkownik widzi podgląd i sam zatwierdza zapis;
- zapis zatwierdzonego draftu jest atomowy oraz idempotentny;
- limit aplikacji blokuje kolejne żądanie przed wywołaniem providera;
- istnieją testy regresji dla generowania, limitera, autoryzacji i akceptacji;
- provider OpenAI jest wymienny na lokalny adapter bez zmiany kontraktu UI/API.
