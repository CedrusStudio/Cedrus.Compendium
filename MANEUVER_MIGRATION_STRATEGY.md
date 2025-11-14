# Strategia Migracji Manewrów z Excel do maneuvers.json

## Problemy Zidentyfikowane w Pierwszej Próbie

### 1. **Duplikaty - Zbyt Prosta Deduplikacja**
Problem: Sprawdzanie tylko po nazwie nie wychwytuje wariantów jak:
- "Błyskawiczny" vs "Błyskawiczny1", "Błyskawiczny2", "Błyskawiczny3"
- Te manewry mają różne grade, ale są to warianty tego samego manewru

**Rozwiązanie:**
- Normalizacja nazw przed porównaniem
- Usunięcie cyfr z końca nazwy przy sprawdzaniu duplikatów
- Porównanie bazowej nazwy (np. "Błyskawiczny" zamiast "Błyskawiczny1")

### 2. **Zanieczyszczenie Description**
Problem: W opisie pozostają elementy meta-informacji:
- "Manewr Natychmiastowy. Dodaje +1 uników" → castTime wyciągnięty, ale fraza pozostała
- "Akcja Standardowa. Opis..." → podobnie

**Rozwiązanie:**
- Po wyciągnięciu castTime, usunąć frazę z opisu
- Wzorce do usunięcia:
  - `^Manewr Natychmiastowy\.\s*`
  - `^Akcja Standardowa\.\s*`
  - `^Natychmiastow[ya]?\.\s*`
  - `^Standardow[ya]?\.\s*`

## Poprawiona Strategia Migracji

### Krok 1: Wczytanie i Przygotowanie Danych

```powershell
# Wczytaj istniejące manewry
$existingManeuvers = Get-Content "formatted-data\maneuvers.json" -Encoding UTF8 | ConvertFrom-Json

# Stwórz mapę bazowych nazw (bez cyfr)
$existingBaseNames = @{}
foreach ($m in $existingManeuvers) {
    $baseName = $m.name -replace '\d+$', ''  # Usuń cyfry z końca
    $existingBaseNames[$baseName.ToLower()] = $true
}
```

### Krok 2: Parsowanie z Excel z Normalizacją

```powershell
for ($row = 2; $row -le $lastRow; $row++) {
    $name = $targetSheet.Cells.Item($row, 2).Text.Trim()
    
    if (-not $name -or $name -eq "") {
        continue
    }
    
    # Normalizacja: usuń cyfry z końca dla porównania
    $baseName = $name -replace '\d+$', ''
    
    # DEDUPLIKACJA: sprawdź bazową nazwę
    if ($existingBaseNames.ContainsKey($baseName.ToLower())) {
        $skipped++
        continue
    }
    
    # ... reszta parsowania
}
```

### Krok 3: Czyszczenie Description

```powershell
# Po parsowaniu action:
$description = $action

# Usuń meta-informacje o castTime z początku opisu
$description = $description -replace '^Manewr Natychmiastowy\.\s*', ''
$description = $description -replace '^Akcja Standardowa\.\s*', ''
$description = $description -replace '^Natychmiastow[ya]?\.\s*', ''
$description = $description -replace '^Standardow[ya]?\.\s*', ''

# Trim whitespace
$description = $description.Trim()
```

### Krok 4: Parsowanie Grade

**Ulepszenie:** Grade nie tylko z nazwy, ale też z opisu jeśli dostępny

```powershell
$grade = 1

# Sprawdź nazwę (np. "Błyskawiczny1")
if ($name -match '(\d+)$') {
    $grade = [int]$matches[1]
}

# Alternatywnie: sprawdź w opisie wzorce typu "poziom 2", "grade 3"
if ($grade -eq 1 -and $description -match 'poziom\s+(\d+)') {
    $grade = [int]$matches[1]
}
```

### Krok 5: Parsowanie CastTime z Priorytetami

```powershell
$castTime = "Standardowa"  # Domyślnie

# Priorytet 1: Szukaj w action/description
if ($action -match 'Natychmiastow') {
    $castTime = "Natychmiastowa"
}
elseif ($action -match 'Standardow') {
    $castTime = "Standardowa"
}

# Priorytet 2: Jeśli częstotliwość to "Natychmiast"
if ($frequency -match 'Natychmiast') {
    $castTime = "Natychmiastowa"
}
```

### Krok 6: Parsowanie Requirements - Ulepszone

```powershell
$reqArray = @()
if ($requirements) {
    # Split by , lub ;
    $reqArray = $requirements -split '[,;]' | ForEach-Object {
        $req = $_.Trim()
        
        # Normalizacja spacji w wymaganiach
        # "Większy Refleks3" → "Większy Refleks 3"
        $req = $req -replace '(\D)(\d+)', '$1 $2'
        
        return $req
    } | Where-Object { $_ -ne "" }
}
```

### Krok 7: Walidacja Przed Zapisem

```powershell
# Sprawdź czy opis nie jest pusty
if (-not $description -or $description -eq "") {
    Write-Host "⚠ Pominięto '$name' - brak opisu" -ForegroundColor Yellow
    continue
}

# Sprawdź czy mamy sensowne dane
if ($description.Length -lt 10) {
    Write-Host "⚠ Pominięto '$name' - opis zbyt krótki ($($description.Length) znaków)" -ForegroundColor Yellow
    continue
}
```

### Krok 8: Formatowanie Output

```powershell
# Utworzenie obiektu z zachowaniem kolejności pól
$maneuver = [ordered]@{
    id = $ulid
    name = $name
    grade = $grade
    description = $description
    castTime = $castTime
}

# Dodaj price tylko jeśli > 0
if ($priceInt -gt 0) {
    $maneuver.price = $priceInt
}

# Dodaj cooldown tylko jeśli istnieje
if ($cooldownInt) {
    $maneuver.cooldown = $cooldownInt
}

# Dodaj requirements tylko jeśli istnieją
if ($reqArray.Count -gt 0) {
    $maneuver.requirements = $reqArray
}

# Zawsze dodaj tags
$maneuver.tags = $tags

$newManeuvers += [PSCustomObject]$maneuver
```

## Testy Walidacyjne

Po migracji, wykonaj następujące testy:

1. **Test duplikatów:**
   ```powershell
   $names = $allManeuvers | Group-Object -Property name
   $duplicates = $names | Where-Object { $_.Count -gt 1 }
   if ($duplicates) {
       Write-Host "❌ Znaleziono duplikaty: $($duplicates.Count)" -ForegroundColor Red
   }
   ```

2. **Test czystości opisów:**
   ```powershell
   $dirtyDescriptions = $allManeuvers | Where-Object {
       $_.description -match '^(Manewr Natychmiastowy|Akcja Standardowa)\.'
   }
   if ($dirtyDescriptions) {
       Write-Host "❌ Znaleziono zanieczyszczone opisy: $($dirtyDescriptions.Count)" -ForegroundColor Red
   }
   ```

3. **Test kompletności:**
   ```powershell
   $incomplete = $allManeuvers | Where-Object {
       -not $_.name -or -not $_.description -or $_.description.Length -lt 10
   }
   if ($incomplete) {
       Write-Host "❌ Znaleziono niekompletne manewry: $($incomplete.Count)" -ForegroundColor Red
   }
   ```

## Podsumowanie Zmian

| Aspekt | Poprzednia Wersja | Nowa Wersja |
|--------|-------------------|-------------|
| Deduplikacja | Po pełnej nazwie | Po nazwie bazowej (bez cyfr) |
| Description | Z meta-informacjami | Oczyszczony z fraz castTime |
| Requirements | Surowe dane | Znormalizowane spacje |
| Walidacja | Brak | Sprawdzanie kompletności |
| Testy | Brak | 3 testy walidacyjne |

## Przykłady Transformacji

### Przykład 1: "Błyskawiczny1"
```
Excel:
  Nazwa: Błyskawiczny1
  Działanie: Manewr Natychmiastowy. Dodaje +1 uników

Poprzednia wersja (błąd):
  name: "Błyskawiczny1"  ← duplikat "Błyskawiczny"
  description: "Manewr Natychmiastowy. Dodaje +1 uników"  ← zanieczyszczone

Nowa wersja (OK):
  POMINIĘTY - duplikat bazowej nazwy "Błyskawiczny"
```

### Przykład 2: Nowy manewru "EstymacjaTrajektorii"
```
Excel:
  Nazwa: EstymacjaTrajektorii
  Działanie: Manewr Natychmiastowy. Refleks liczy się do redukcji przeciw...

Poprzednia wersja:
  description: "Manewr Natychmiastowy. Refleks liczy się do redukcji przeciw..."

Nowa wersja:
  description: "Refleks liczy się do redukcji przeciw..."
  castTime: "Natychmiastowa"
```

## Kolejność Wykonania

1. ✅ Stworzenie strategii (ten dokument)
2. ⏳ Implementacja poprawionego skryptu
3. ⏳ Uruchomienie migracji z walidacją
4. ⏳ Wykonanie testów walidacyjnych
5. ⏳ Przegląd wyników i ewentualne poprawki
6. ⏳ Zatwierdzenie zmian

## Dodatkowe Uwagi

- **Backup:** Przed migracją zawsze tworzyć backup `maneuvers.json`
- **Incremental:** Można uruchomić migrację inkrementalnie (np. 100 manewrów na raz)
- **Manual Review:** Po migracji przejrzeć próbkę 10-20 losowych manewrów
- **Edge Cases:** Uważać na manewry z nietypowymi nazwami (symbole, Unicode, etc.)
