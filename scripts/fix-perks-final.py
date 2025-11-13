# -*- coding: utf-8 -*-
# Skrypt do poprawy języka polskiego w perks.json

import json
import re

def fix_perks():
    print("🚀 Rozpoczynam poprawianie perks.json...")
    
    # Wczytaj plik
    with open('formatted-data/perks.json', 'r', encoding='utf-8') as f:
        perks = json.load(f)
    
    print(f"📊 Znaleziono {len(perks)} perków")
    
    corrected_count = 0
    
    for perk in perks:
        if not perk.get('name') or not perk.get('name').strip():
            continue
            
        was_changed = False
        
        # 1. Popraw nazwy perków (błędy ortograficzne)
        original_name = perk.get('name', '')
        name = original_name
        name = re.sub(r'Mistrzostwo w skytobójstwie', 'Mistrzostwo w skrytobójstwie', name)
        name = re.sub(r'Wiruoz', 'Wirtuoz', name)
        
        if name != original_name:
            perk['name'] = name
            was_changed = True
            print(f"✏️  Poprawiono nazwę: {original_name} → {name}")
        
        # 2. Popraw opisy
        original_desc = perk.get('description', '')
        desc = original_desc
        
        # Błędy ortograficzne w opisach
        desc = re.sub(r'prezyzji', 'precyzji', desc)
        desc = re.sub(r'\bkare\b', 'karę', desc)
        
        # Dodaj kropkę na końcu jeśli brakuje
        if desc and not desc.endswith(('.', '!', '?')):
            desc = desc.strip() + '.'
            
        if desc != original_desc:
            perk['description'] = desc
            was_changed = True
        
        # 3. Popraw requirements
        original_reqs = perk.get('requirements', [])
        new_requirements = []
        
        for req in original_reqs:
            if not req:
                continue
                
            clean_req = req.strip()
            
            # Usuń nawiasy z requirements
            clean_req = re.sub(r'^\(', '', clean_req)
            clean_req = re.sub(r'\)$', '', clean_req)
            
            # Dodaj spacje przed cyframi w nazwach
            clean_req = re.sub(r'([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])(\d+)', r'\1 \2', clean_req)
            
            # Popraw "lub" z właściwymi spacjami
            clean_req = re.sub(r'\s*lub\s*', ' lub ', clean_req)
            
            # Błędy ortograficzne w wymaganiach
            clean_req = re.sub(r'Wiruoz', 'Wirtuoz', clean_req)
            
            # Usuń nadmiarowe spacje
            clean_req = re.sub(r'\s+', ' ', clean_req).strip()
            
            if clean_req:
                new_requirements.append(clean_req)
        
        if new_requirements != original_reqs:
            perk['requirements'] = new_requirements
            was_changed = True
        
        if was_changed:
            corrected_count += 1
    
    # Usuń puste perki
    clean_perks = [p for p in perks if p.get('name') and p.get('name').strip() and 
                   p.get('description') and p.get('description').strip() and 
                   p.get('description') != 'Brak opisu']
    
    removed_count = len(perks) - len(clean_perks)
    
    # Zapisz poprawiony plik
    with open('formatted-data/perks.json', 'w', encoding='utf-8') as f:
        json.dump(clean_perks, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Zakończono poprawianie perks.json!")
    print(f"📊 Poprawiono {corrected_count} perków")
    if removed_count > 0:
        print(f"📊 Usunięto {removed_count} pustych perków")
    print(f"📊 Pozostało {len(clean_perks)} perków")

if __name__ == "__main__":
    fix_perks()