# -*- coding: utf-8 -*-
# Skrypt weryfikacyjny dla castTime w maneuvers.json

import json
import re

def verify_cast_times():
    print("🔍 Weryfikuję castTime w maneuvers.json...")
    
    with open('formatted-data/maneuvers.json', 'r', encoding='utf-8') as f:
        maneuvers = json.load(f)
    
    errors = {
        'cast_time_in_desc': [],
        'missing_cast_time': [],
        'invalid_cast_time': []
    }
    
    valid_cast_times = ['Natychmiastowa', 'Standardowa', 'Reakcja', 'Nadnatychmiastowa']
    
    for i, maneuver in enumerate(maneuvers):
        name = maneuver.get('name', '')
        desc = maneuver.get('description', '')
        cast_time = maneuver.get('castTime', '')
        
        # Sprawdź czy w opisie nie ma słów określających castTime
        if re.search(r'^(Natychmiastowa|Standardowa|Reakcja)\.', desc):
            errors['cast_time_in_desc'].append(f"#{i+1}: {name} - '{desc[:50]}...'")
        
        # Sprawdź czy castTime jest ustawiony
        if not cast_time:
            errors['missing_cast_time'].append(f"#{i+1}: {name}")
        
        # Sprawdź czy castTime ma poprawną wartość
        if cast_time and cast_time not in valid_cast_times:
            errors['invalid_cast_time'].append(f"#{i+1}: {name} - '{cast_time}'")
    
    print(f"\n📊 Wyniki weryfikacji:")
    print(f"   Manewrów: {len(maneuvers)}")
    print(f"   castTime w opisach: {len(errors['cast_time_in_desc'])}")
    print(f"   Brakujące castTime: {len(errors['missing_cast_time'])}")
    print(f"   Niepoprawne castTime: {len(errors['invalid_cast_time'])}")
    
    if any(errors.values()):
        print(f"\n❌ Znaleziono błędy!")
        for category, items in errors.items():
            if items:
                print(f"\n{category.upper()}:")
                for item in items[:5]:  # Pokaż pierwsze 5
                    print(f"  - {item}")
                if len(items) > 5:
                    print(f"  ... i {len(items) - 5} więcej")
        return False
    else:
        print(f"\n✅ Wszystko wygląda dobrze!")
        
        # Pokaż statystyki castTime
        cast_time_stats = {}
        for m in maneuvers:
            ct = m.get('castTime', 'Brak')
            cast_time_stats[ct] = cast_time_stats.get(ct, 0) + 1
        
        print(f"\n📊 Statystyki castTime:")
        for ct, count in sorted(cast_time_stats.items()):
            print(f"   {ct}: {count}")
        
        return True

if __name__ == "__main__":
    verify_cast_times()