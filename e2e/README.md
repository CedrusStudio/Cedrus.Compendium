# Testy interfejsu w przeglądarce

Po instalacji zależności pobierz przeglądarki testowe:

```powershell
node node_modules/playwright/cli.js install chromium webkit firefox
```

Zatrzymaj wcześniej lokalne `npm run dev`: testy uruchamiają własny serwer na **http://localhost:3101**, ale oba serwery deweloperskie używają katalogu `.next`. Uruchomienie testów nie przejmuje istniejącego procesu ani bazy aplikacji.

```powershell
npm run test:e2e:mobile     # Chromium: 320 i 390 px; także tablet/poziomo
npm run test:e2e            # desktop Chromium
npm run test:visual:mobile  # strony i ich zrzuty przy 390 px
npm run test:e2e:report     # przegląd ostatniego raportu HTML
```

Własny wybór projektów i przypadków:

```powershell
node scripts/run-e2e.mjs --project=webkit
node scripts/run-e2e.mjs --project=firefox --grep layout
node scripts/run-e2e.mjs --project=phone-320 --grep "mobile search"
```

`run-e2e.mjs` normalizuje PATH wyłącznie procesu testowego na Windows, aby długi PATH nie psuł uruchamiania i zamykania serwera. Jeśli samo `npm run …` zgłasza brak `node`/`next`, a PowerShell widzi Node, użyj bezpośrednio powyższego polecenia `node scripts/run-e2e.mjs`.

## Co jest sprawdzane

- Reprezentant każdej strony z `src/app`; nowa strona bez wpisu w zestawie powoduje błąd kontroli pokrycia.
- Szerokość dokumentu, błędy wykonania, zrzuty stron i zakładek; szerokie tabele/grafy/A4 muszą mieć własny obszar przewijania. Otwarte dialogi, panele i popovery muszą mieścić się także w wysokości ekranu.
- Karta i wszystkie formularze edycji, zachowanie wartości po resize, wybór postaci i przypisanie/odpięcie atutu, tworzenie z propozycji AI.
- Zapis danych postaci i odczyt po odświeżeniu; ponowienie po błędzie przypisania, zachowanie wyboru postaci i filtra „Tylko posiadane” po odświeżeniu. Dane testowe spełniają reguły tagów formularza (małe litery, bez spacji).
- Filtry z szybkimi tagami: na telefonie po przewinięciu nagłówek znika z widoku. Dodatkowo popover kategorii i akcja „tylko” bez hover.
- Wszystkie analizatory Combat Lab, prawdziwy worker symulacji, zapis jej wyniku i raport; panel długich wymagań, bitwa i preset.
- Mobilny podgląd A4 oraz PDF bez paska narzędzi. PDF jest sprawdzany w Chromium.

API w przeglądarce jest w całości zastępowane kontrolowanymi odpowiedziami, również przy zapisie. Serwer otrzymuje osobny, nieosiągalny adres bazy `cedrus_mobile_layout_test`, aby jego prefetch też nie odczytywał bazy użytkownika. Testy nie wymagają MongoDB i nie potwierdzają rzeczywistej persystencji. Jej istniejące testy integracyjne pozostają osobnym zestawem. AI otrzymuje gotową propozycję; nie są wywoływane płatne modele. Obliczenia symulacji i replay wykonuje rzeczywisty kod aplikacji.

Instrukcja oddzielnych testów rzeczywistego MongoDB z `MEMBERSHIP_TEST_DATABASE_URL`: [plan kontekstu postaci](../features-to-implement/compendium-character-scope-plan.md). Podczas ponownej weryfikacji mobilnej zaliczono wszystkie 10 tych testów na tymczasowej bazie; kontener po sprawdzeniu usunięto.

## Wyniki i odbiór

`playwright-report/` zawiera raport HTML, a `test-results/` zrzuty, PDF i trace błędów. Kolejny przebieg zastępuje te katalogi; potrzebne obrazy należy wcześniej zachować. Są ignorowane przez Git. `test:visual:mobile` generuje obrazy do obejrzenia; nie jest porównaniem pikselowym z zatwierdzonym baseline'em.

Do kontroli produkcyjnej najpierw zbuduj aplikację, następnie:

```powershell
npm run build
$env:E2E_PRODUCTION = '1'
node scripts/run-e2e.mjs --project=phone-320 --project=desktop --project=webkit
Remove-Item Env:E2E_PRODUCTION
```

Workflow `Mobile UI` wykonuje kontrolę typów, build i testy na PR-ach oraz udostępnia artefakty przez 14 dni. Nie zastępuje oględzin obrazów ani sprawdzenia prawdziwej klawiatury, pasków przeglądarki i gestów na iOS/Androidzie. Dodatkowe warianty języka aplikacji wymagają osobnego uruchomienia z `NEXT_LANGUAGE`; zmiana locale samej przeglądarki nie zmienia etykiet aplikacji. Obecne asercje nazw kontrolek zakładają PL.
