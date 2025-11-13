# -*- coding: utf-8 -*-
# Skrypt weryfikacyjny dla maneuvers.json

import json
import re

def verify_maneuvers():
    print("🔍 Weryfikuję poprawność maneuvers.json...")
    
    with open('formatted-data/maneuvers.json', 'r', encoding='utf-8') as f:
        maneuvers = json.load(f)
    
    errors = {
        'ortografia': [],
        'formatowanie': [],
        'brak_kropki': []
    }
    
    for i, maneuver in enumerate(maneuvers):
        name = maneuver.get('name', '')
        desc = maneuver.get('description', '')
        reqs = maneuver.get('requirements', [])
        
        # Sprawdź błędy ortograficzne
        if 'Wiekszy' in name or 'Wieksza' in name or 'Świadomośc' in name:
            errors['ortografia'].append(f"#{i+1}: {name}")
        
        # Sprawdź formatowanie requirements
        for req in reqs:
            if re.search(r'[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]\d+', req) and not req.startswith('01'):
                errors['formatowanie'].append(f"#{i+1}: {req}")
        
        # Sprawdź kropkę na końcu opisu
        if desc and not desc.endswith(('.', '!', '?')):
            errors['brak_kropki'].append(f"#{i+1}: {name}")
    
    print(f"\n📊 Wyniki weryfikacji:")
    print(f"   Manewrów: {len(maneuvers)}")
    print(f"   Błędów ortograficznych: {len(errors['ortografia'])}")
    print(f"   Błędów formatowania: {len(errors['formatowanie'])}")
    print(f"   Brak kropek: {len(errors['brak_kropki'])}")
    
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
        return True

if __name__ == "__main__":
    verify_maneuvers()