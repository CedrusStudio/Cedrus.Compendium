import { parseNameAndGrade, parseNameAndGradeList } from './referenceParser';

export type ManeuverReference = {
  name: string;
  grade: number;
};

export type PerkReference = {
  name: string;
  grade: number;
};

export type StanceReference = {
  name: string;
  grade: number;
};

export type StateReference = {
  name: string;
  grade: number;
};

export type WeaponReference = {
  name: string;
};

export type ArmorReference = {
  name: string;
};

export type ShieldReference = {
  name: string;
};

export type EquipmentReferences = {
  weapons: WeaponReference[];
  armors: ArmorReference[];
  shields: ShieldReference[];
};

export type Ability = {
  name: string;
  description: string;
  actionType?: string;
};

// Combat type indicators that should be tags, not maneuvers
const COMBAT_TYPES = ['walka wręcz', 'walka wrecz', 'łucznik', 'lucznik', 'szermierz', 'konny'];

/**
 * Parsuje referencje manewrów z kolumny Excel i wierszy umiejętności
 */
export function parseManeuverReferences(
  maneuversRaw: string,
  abilities: Ability[]
): ManeuverReference[] {
  const refs: ManeuverReference[] = [];

  // 1. Parse z kolumny manewrów
  if (maneuversRaw && !maneuversRaw.toLowerCase().includes('brak')) {
    const fromColumn = parseNameAndGradeList(maneuversRaw);
    
    // Filter out combat type indicators from column
    for (const item of fromColumn) {
      const normalizedName = item.name.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!COMBAT_TYPES.includes(normalizedName)) {
        refs.push(item);
      }
    }
  }

  // 2. Parse z abilities (te z actionType to manewry)
  for (const ability of abilities) {
    if (ability.actionType) {
      const parsed = parseNameAndGrade(ability.name);
      
      // Skip combat type indicators (exact match after normalization)
      const normalizedName = parsed.name.toLowerCase().replace(/\s+/g, ' ').trim();
      if (COMBAT_TYPES.includes(normalizedName)) {
        continue;
      }
      
      // Sprawdź czy już nie dodaliśmy tego manewru
      if (!refs.some(r => r.name === parsed.name && r.grade === parsed.grade)) {
        refs.push(parsed);
      }
    }
  }

  return refs;
}

/**
 * Wyodrębnia typy walki z kolumny manewrów i abilities do tagów (bez grade)
 */
export function extractCombatTypes(maneuversRaw: string, abilities: Ability[]): string[] {
  const types: string[] = [];
  
  // Extract from maneuvers column
  if (maneuversRaw && !maneuversRaw.toLowerCase().includes('brak')) {
    const fromColumn = parseNameAndGradeList(maneuversRaw);
    
    for (const item of fromColumn) {
      const normalizedName = item.name.toLowerCase().replace(/\s+/g, ' ').trim();
      
      if (COMBAT_TYPES.includes(normalizedName)) {
        const tag = normalizedName.replace(/\s+/g, '-');
        if (!types.includes(tag)) {
          types.push(tag);
        }
      }
    }
  }
  
  // Extract from abilities
  for (const ability of abilities) {
    if (ability.actionType) {
      const parsed = parseNameAndGrade(ability.name);
      const normalizedName = parsed.name.toLowerCase().replace(/\s+/g, ' ').trim();
      
      if (COMBAT_TYPES.includes(normalizedName)) {
        const tag = normalizedName.replace(/\s+/g, '-');
        if (!types.includes(tag)) {
          types.push(tag);
        }
      }
    }
  }
  
  return types;
}

/**
 * Parsuje referencje perków z wierszy umiejętności (bez actionType)
 */
export function parsePerkReferences(abilities: Ability[]): PerkReference[] {
  const refs: PerkReference[] = [];

  for (const ability of abilities) {
    if (!ability.actionType) {
      const parsed = parseNameAndGrade(ability.name);
      
      // Skip section headers like "Pasywy", "Postawy"
      if (parsed.name.toLowerCase() === 'pasywy' || 
          parsed.name.toLowerCase() === 'postawy') {
        continue;
      }
      
      // Sprawdź czy już nie dodaliśmy tego perku
      if (!refs.some(r => r.name === parsed.name && r.grade === parsed.grade)) {
        refs.push(parsed);
      }
    }
  }

  return refs;
}

/**
 * Parsuje referencje ekwipunku z kolumny Excel
 */
export function parseEquipmentReferences(raw: string): EquipmentReferences {
  const items = raw.split(',').map(i => i.trim()).filter(i => i.length > 0);

  const refs: EquipmentReferences = {
    weapons: [],
    armors: [],
    shields: []
  };

  for (const item of items) {
    const parsed = parseNameAndGrade(item);
    
    // Skip "Bez zbroi" - means no armor
    if (parsed.name.toLowerCase() === 'bez zbroi') {
      continue;
    }
    
    if (isWeapon(parsed.name)) {
      refs.weapons.push({ name: parsed.name });
    } else if (isArmor(parsed.name)) {
      refs.armors.push({ name: parsed.name });
    } else if (isShield(parsed.name)) {
      refs.shields.push({ name: parsed.name });
    }
  }

  return refs;
}

function isWeapon(name: string): boolean {
  const weaponKeywords = [
    'walka wręcz', 'miecz', 'topór', 'młot', 'włócznia', 'sztylet', 
    'łuk', 'kusza', 'pałka', 'buzdygan', 'kopia', 'rapier', 'szpada',
    'gladius', 'katana', 'nóż', 'broń', 'weapon'
  ];
  const lowerName = name.toLowerCase();
  return weaponKeywords.some(keyword => lowerName.includes(keyword));
}

function isArmor(name: string): boolean {
  const armorKeywords = [
    'zbroja', 'pancerz', 'kolczuga', 'lekka', 'średnia', 'ciężka',
    'armor', 'bez zbroi', 'skórzana', 'płytowa'
  ];
  const lowerName = name.toLowerCase();
  return armorKeywords.some(keyword => lowerName.includes(keyword));
}

function isShield(name: string): boolean {
  const shieldKeywords = [
    'tarcza', 'shield', 'mała tarcza', 'duża tarcza', 'puklerz'
  ];
  const lowerName = name.toLowerCase();
  return shieldKeywords.some(keyword => lowerName.includes(keyword));
}
