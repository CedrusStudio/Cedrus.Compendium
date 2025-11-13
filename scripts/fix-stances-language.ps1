# Skrypt do poprawy języka polskiego i formatowania w stances.json

$inputFile = "formatted-data\stances.json"
$stances = Get-Content $inputFile -Raw | ConvertFrom-Json

foreach ($stance in $stances) {
    $desc = $stance.description
    
    # 1. Błędy ortograficzne
    $desc = $desc -replace 'siłe\b', 'siłę'
    $desc = $desc -replace 'zwieksza', 'zwiększa'
    $desc = $desc -replace 'zminiejsza', 'zmniejsza'
    $desc = $desc -replace 'Posstawa', 'Postawa'
    $desc = $desc -replace 'pręmię', 'premię'
    $desc = $desc -replace 'uników', 'uniku'
    $desc = $desc -replace '(\d+)\s+uników', '$1 uniku'
    $desc = $desc -replace 'parownia', 'parowania'
    
    # 2. Formatowanie spacji przed "k" w kościach (k4, k6, k8, k10, k12, k20)
    $desc = $desc -replace '\s+k(\d+)', ' k$1'
    $desc = $desc -replace '([^\s])k(\d+)', '$1 k$2'
    
    # 3. Formatowanie przecinków (spacja po przecinku)
    $desc = $desc -replace ',([^\s])', ', $1'
    
    # 4. Spacje wokół operatorów +/-
    $desc = $desc -replace '(\d+)([+-])(\d+)', '$1 $2$3'
    $desc = $desc -replace '\+(\d+)', '+$1'
    $desc = $desc -replace '\-(\d+)', '-$1'
    
    # 5. Forma dopełniacza "obrażeń" (nie "obrażenia" po liczbach)
    $desc = $desc -replace '(\d+)\s+obrażenia\b', '$1 obrażeń'
    $desc = $desc -replace 'Odejmuje\s+(\d+)\s+obrażenia', 'Odejmuje $1 obrażeń'
    $desc = $desc -replace 'dodaje\s+(\d+)\s+obrażenia', 'dodaje $1 obrażeń'
    $desc = $desc -replace 'zmniejsza\s+obrażenia', 'zmniejsza obrażenia'
    
    # 6. Forma dopełniacza "odporności", "redukcji"
    $desc = $desc -replace '(\d+)\s+odporność\b', '$1 odporności'
    $desc = $desc -replace '(\d+)\s+redukcję\b', '$1 redukcji'
    $desc = $desc -replace '(\d+)\s+redukcje\b', '$1 redukcji'
    $desc = $desc -replace 'dodaje\s+(\d+)\s+odporność', 'dodaje $1 odporności'
    $desc = $desc -replace 'dodaje\s+(\d+)\s+redukcję', 'dodaje $1 redukcji'
    
    # 7. Forma dopełniacza "blokowania", "parowania"
    $desc = $desc -replace '(\d+)\s+blokowania\b(?!\s+jeśli)', '$1 blokowania'
    $desc = $desc -replace '(\d+)\s+parowania\b', '$1 parowania'
    
    # 8. Wielkie litery po przecinku jeśli nowe zdanie
    $desc = $desc -replace ',\s+([a-ząćęłńóśźż])', ', $1'
    
    # 9. Podwójne spacje
    $desc = $desc -replace '\s{2,}', ' '
    
    # 10. Kropka na końcu
    if (-not $desc.EndsWith('.')) {
        $desc = $desc + '.'
    }
    
    # 11. "maks" -> "maks."
    $desc = $desc -replace '\bmaks\s+', 'maks. '
    
    # 12. Spacja przed "a" w znaczeniu "oraz/natomiast"
    $desc = $desc -replace '([0-9])\s*a\s+', '$1, a '
    
    $stance.description = $desc
}

# Zapisz poprawiony plik
$stances | ConvertTo-Json -Depth 10 | Set-Content $inputFile -Encoding UTF8

Write-Host "✅ Poprawiono język polski i formatowanie w stances.json" -ForegroundColor Green
