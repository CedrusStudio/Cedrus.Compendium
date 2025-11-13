# -*- coding: utf-8 -*-
# Skrypt do poprawy języka polskiego w maneuvers.json

import json
import re

def fix_maneuvers():
    print("🚀 Rozpoczynam poprawianie maneuvers.json...")
    
    # Wczytaj plik
    with open('formatted-data/maneuvers.json', 'r', encoding='utf-8') as f:
        maneuvers = json.load(f)
    
    print(f"📊 Znaleziono {len(maneuvers)} manewrów")
    
    corrected_count = 0
    errors_found = {
        'ortografia': 0,
        'formatowanie_requirements': 0,
        'formatowanie_opisu': 0
    }
    
    for maneuver in maneuvers:
        if not maneuver.get('name') or not maneuver.get('name').strip():
            continue
            
        was_changed = False
        
        # 1. Popraw nazwy manewrów (błędy ortograficzne)
        original_name = maneuver.get('name', '')
        name = original_name
        
        # Błędy ortograficzne w nazwach
        if 'Wiekszy' in name or 'Wieksza' in name or 'Świadomośc' in name:
            name = re.sub(r'Wiekszy', 'Większy', name)
            name = re.sub(r'Wieksza', 'Większa', name)
            name = re.sub(r'Świadomośc', 'Świadomość', name)
            
        if name != original_name:
            maneuver['name'] = name
            was_changed = True
            errors_found['ortografia'] += 1
            print(f"✏️  Poprawiono nazwę: {original_name} → {name}")
        
        # 2. Popraw opisy
        original_desc = maneuver.get('description', '')
        desc = original_desc
        
        # Błędy ortograficzne w opisach
        desc = re.sub(r'Wiekszy', 'Większy', desc)
        desc = re.sub(r'Wieksza', 'Większa', desc)
        desc = re.sub(r'Świadomośc', 'Świadomość', desc)
        
        # Dodaj kropkę na końcu jeśli brakuje
        if desc and not desc.endswith(('.', '!', '?')):
            desc = desc.strip() + '.'
            
        if desc != original_desc:
            maneuver['description'] = desc
            was_changed = True
            errors_found['formatowanie_opisu'] += 1
        
        # 3. Popraw requirements
        original_reqs = maneuver.get('requirements', [])
        new_requirements = []
        
        for req in original_reqs:
            if not req:
                continue
                
            clean_req = req.strip()
            
            # Popraw błędy ortograficzne w requirements
            clean_req = re.sub(r'Wiekszy', 'Większy', clean_req)
            clean_req = re.sub(r'Wieksza', 'Większa', clean_req)
            clean_req = re.sub(r'Świadomośc', 'Świadomość', clean_req)
            
            # Dodaj spacje przed cyframi w nazwach (ale nie dla ID)
            # Dopasuj literę/polską literę + cyfrę, ale tylko jeśli to nie jest część ID
            if not clean_req.startswith('01'):  # ID zaczynają się od 01
                clean_req = re.sub(r'([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])(\d+)', r'\1 \2', clean_req)
            
            # Usuń nadmiarowe spacje
            clean_req = re.sub(r'\s+', ' ', clean_req).strip()
            
            if clean_req != req.strip():
                errors_found['formatowanie_requirements'] += 1
            
            if clean_req:
                new_requirements.append(clean_req)
        
        if new_requirements != original_reqs:
            maneuver['requirements'] = new_requirements
            was_changed = True
        
        if was_changed:
            corrected_count += 1
    
    # Usuń puste manewry
    clean_maneuvers = [m for m in maneuvers if m.get('name') and m.get('name').strip() and 
                       m.get('description') and m.get('description').strip() and 
                       m.get('description') != 'Brak opisu']
    
    removed_count = len(maneuvers) - len(clean_maneuvers)
    
    # Zapisz poprawiony plik
    with open('formatted-data/maneuvers.json', 'w', encoding='utf-8') as f:
        json.dump(clean_maneuvers, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Zakończono poprawianie maneuvers.json!")
    print(f"📊 Poprawiono {corrected_count} manewrów")
    print(f"   - Błędy ortograficzne (nazwy): {errors_found['ortografia']}")
    print(f"   - Błędy formatowania (requirements): {errors_found['formatowanie_requirements']}")
    print(f"   - Błędy formatowania (opisy): {errors_found['formatowanie_opisu']}")
    if removed_count > 0:
        print(f"📊 Usunięto {removed_count} pustych manewrów")
    print(f"📊 Pozostało {len(clean_maneuvers)} manewrów")

if __name__ == "__main__":
    fix_maneuvers()