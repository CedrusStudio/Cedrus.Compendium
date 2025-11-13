# -*- coding: utf-8 -*-
# Skrypt do poprawy castTime w maneuvers.json

import json
import re

def fix_cast_times():
    print("🚀 Rozpoczynam poprawianie castTime w maneuvers.json...")
    
    # Wczytaj plik
    with open('formatted-data/maneuvers.json', 'r', encoding='utf-8') as f:
        maneuvers = json.load(f)
    
    print(f"📊 Znaleziono {len(maneuvers)} manewrów")
    
    corrected_count = 0
    cast_time_patterns = {
        'Natychmiastowa': r'^Natychmiastowa\.\s*',
        'Standardowa': r'^Standardowa\.\s*',
        'Reakcja': r'^Reakcja\.\s*'
    }
    
    issues_found = []
    
    for i, maneuver in enumerate(maneuvers):
        name = maneuver.get('name', '')
        desc = maneuver.get('description', '')
        current_cast_time = maneuver.get('castTime', '')
        
        # Sprawdź czy opis zaczyna się od słowa określającego castTime
        detected_cast_time = None
        for cast_type, pattern in cast_time_patterns.items():
            if re.match(pattern, desc):
                detected_cast_time = cast_type
                break
        
        if detected_cast_time:
            # Znaleziono castTime w opisie
            if current_cast_time != detected_cast_time:
                # castTime w polu różni się od tego w opisie - POPRAW!
                issues_found.append({
                    'index': i,
                    'name': name,
                    'current': current_cast_time,
                    'should_be': detected_cast_time,
                    'desc_preview': desc[:80]
                })
                
                # Popraw castTime
                maneuver['castTime'] = detected_cast_time
                print(f"⚠️  {name}: castTime zmieniony z '{current_cast_time}' na '{detected_cast_time}'")
            
            # Usuń słowo określające castTime z opisu
            for cast_type, pattern in cast_time_patterns.items():
                desc = re.sub(pattern, '', desc)
            
            # Upewnij się, że pierwsza litera jest wielka
            if desc:
                desc = desc[0].upper() + desc[1:] if len(desc) > 1 else desc.upper()
            
            maneuver['description'] = desc
            corrected_count += 1
    
    # Zapisz poprawiony plik
    with open('formatted-data/maneuvers.json', 'w', encoding='utf-8') as f:
        json.dump(maneuvers, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Zakończono poprawianie castTime!")
    print(f"📊 Poprawiono {corrected_count} manewrów")
    print(f"📊 Znaleziono {len(issues_found)} niezgodności castTime")
    
    if issues_found:
        print(f"\n⚠️  Szczegóły niezgodności:")
        for issue in issues_found[:10]:  # Pokaż pierwsze 10
            print(f"   - {issue['name']}: '{issue['current']}' → '{issue['should_be']}'")
        if len(issues_found) > 10:
            print(f"   ... i {len(issues_found) - 10} więcej")
    
    return corrected_count, len(issues_found)

if __name__ == "__main__":
    fix_cast_times()