import fs from 'fs';
import path from 'path';
import { ulid } from 'ulid';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const WEAPONS_PATH = path.join(FORMATTED_DATA_DIR, 'weapons.json');
const ARMORS_PATH = path.join(FORMATTED_DATA_DIR, 'armors.json');
const SHIELDS_PATH = path.join(FORMATTED_DATA_DIR, 'shields.json');

type Weapon = {
  id?: string;
  name: string;
  description: string;
  tags: string[];
  style: string;
  offense: {
    amount: number;
    grade: number;
    bonus: number;
    critical: {
      power: number;
      range: number;
    };
  };
  damageBonus: {
    amount: number;
    grade: number;
    bonus: number;
  };
  range: number;
};

type Armor = {
  id?: string;
  name: string;
  description: string;
  tags: string[];
  resistance: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
  immunity: number;
  protection: number;
};

type Shield = {
  id?: string;
  name: string;
  description: string;
  tags: string[];
  resistance: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
  block: number;
};

// Missing weapons with their properties (based on similar items)
const MISSING_WEAPONS: Partial<Weapon>[] = [
  {
    name: "Długi Łuk Refleksyjny",
    description: "Wersja refleksyjna długiego łuku",
    tags: ["łuki", "dystans", "dwuręczne"],
    style: "Dwuręczny",
    offense: { amount: 1, grade: 5, bonus: 0, critical: { power: 0, range: 0 } },
    damageBonus: { amount: 0, grade: 1, bonus: 2 },
    range: 60
  },
  {
    name: "Dwuręczny Topór",
    description: "Wielki topór bojowy",
    tags: ["topory", "dwuręczne", "sieczne"],
    style: "Dwuręczny",
    offense: { amount: 1, grade: 8, bonus: 0, critical: { power: 1, range: 0 } },
    damageBonus: { amount: 0, grade: 1, bonus: 3 },
    range: 1
  },
  {
    name: "Miecz Bastardowy (Półtorak)",
    description: "Półtorak - miecz bastardowy",
    tags: ["miecze", "półtoraręczne"],
    style: "Jednoręczny",
    offense: { amount: 1, grade: 6, bonus: 0, critical: { power: 0, range: 0 } },
    damageBonus: { amount: 0, grade: 1, bonus: 2 },
    range: 1
  },
  {
    name: "Topór",
    description: "Standardowy topór bojowy",
    tags: ["topory", "jednoręczne", "sieczne"],
    style: "Jednoręczny",
    offense: { amount: 1, grade: 6, bonus: 0, critical: { power: 1, range: 0 } },
    damageBonus: { amount: 0, grade: 1, bonus: 2 },
    range: 1
  },
  {
    name: "Miecz",
    description: "Standardowy miecz",
    tags: ["miecze", "jednoręczne"],
    style: "Jednoręczny",
    offense: { amount: 1, grade: 5, bonus: 0, critical: { power: 0, range: 0 } },
    damageBonus: { amount: 0, grade: 1, bonus: 2 },
    range: 1
  },
  {
    name: "Dwa Gladiusy",
    description: "Para krótkich mieczy rzymskich",
    tags: ["miecze", "krótkie", "para"],
    style: "Jednoręczny",
    offense: { amount: 2, grade: 3, bonus: 1, critical: { power: 0, range: -1 } },
    damageBonus: { amount: 0, grade: 1, bonus: 2 },
    range: 1
  },
  {
    name: "Miecz+",
    description: "Ulepszona wersja miecza",
    tags: ["miecze", "jednoręczne", "ulepszone"],
    style: "Jednoręczny",
    offense: { amount: 1, grade: 6, bonus: 0, critical: { power: 0, range: 0 } },
    damageBonus: { amount: 0, grade: 1, bonus: 3 },
    range: 1
  },
  {
    name: "Krótki Miecz",
    description: "Krótka broń sieczna",
    tags: ["miecze", "krótkie"],
    style: "Jednoręczny",
    offense: { amount: 1, grade: 4, bonus: 0, critical: { power: 0, range: 0 } },
    damageBonus: { amount: 0, grade: 1, bonus: 1 },
    range: 1
  },
  {
    name: "Włócznia z Irithium",
    description: "Włócznia wykonana z irithium",
    tags: ["włócznie", "rzutne", "jednoręczne", "magiczne"],
    style: "Jednoręczny",
    offense: { amount: 1, grade: 5, bonus: 1, critical: { power: 1, range: 0 } },
    damageBonus: { amount: 0, grade: 1, bonus: 2 },
    range: 8
  }
];

// Missing armors
const MISSING_ARMORS: Partial<Armor>[] = [
  {
    name: "Zbroja Łuskowa Stalowa",
    description: "Stalowa zbroja łuskowa",
    tags: ["zbroje", "średnie"],
    resistance: 6,
    dexterityRestriction: 1,
    reflexRestriction: 1,
    initiativeRestriction: 1,
    attributePenalty: 1,
    strengthRequirement: 3,
    immunity: 0,
    protection: 1
  },
  {
    name: "Mistrzowska Zbroja Łuskowa",
    description: "Mistrzowskiej jakości zbroja łuskowa",
    tags: ["zbroje", "średnie", "mistrzowskie"],
    resistance: 7,
    dexterityRestriction: 0,
    reflexRestriction: 0,
    initiativeRestriction: 0,
    attributePenalty: 0,
    strengthRequirement: 3,
    immunity: 0,
    protection: 2
  },
  {
    name: "Zbroja Płytkowa",
    description: "Zbroja płytkowa",
    tags: ["zbroje", "ciężkie"],
    resistance: 10,
    dexterityRestriction: 3,
    reflexRestriction: 3,
    initiativeRestriction: 3,
    attributePenalty: 3,
    strengthRequirement: 5,
    immunity: 0,
    protection: 2
  },
  {
    name: "Zbroja Półplytowa",
    description: "Zbroja półpłytowa",
    tags: ["zbroje", "ciężkie"],
    resistance: 8,
    dexterityRestriction: 2,
    reflexRestriction: 2,
    initiativeRestriction: 2,
    attributePenalty: 2,
    strengthRequirement: 4,
    immunity: 0,
    protection: 1
  },
  {
    name: "Pełna  Płytowa+",
    description: "Ulepszona pełna zbroja płytowa",
    tags: ["zbroje", "ciężkie", "ulepszone"],
    resistance: 13,
    dexterityRestriction: 4,
    reflexRestriction: 4,
    initiativeRestriction: 4,
    attributePenalty: 4,
    strengthRequirement: 6,
    immunity: 0,
    protection: 3
  },
  {
    name: "Zbroja  Pełna  Płytowa+",
    description: "Ulepszona pełna zbroja płytowa",
    tags: ["zbroje", "ciężkie", "ulepszone"],
    resistance: 13,
    dexterityRestriction: 4,
    reflexRestriction: 4,
    initiativeRestriction: 4,
    attributePenalty: 4,
    strengthRequirement: 6,
    immunity: 0,
    protection: 3
  },
  {
    name: "Pełna Płytowa",
    description: "Pełna zbroja płytowa",
    tags: ["zbroje", "ciężkie"],
    resistance: 12,
    dexterityRestriction: 4,
    reflexRestriction: 4,
    initiativeRestriction: 4,
    attributePenalty: 4,
    strengthRequirement: 6,
    immunity: 0,
    protection: 2
  }
];

// Missing shields
const MISSING_SHIELDS: Partial<Shield>[] = [
  {
    name: "Duża tarcza+",
    description: "Ulepszona duża tarcza",
    tags: ["tarcze", "duże", "ulepszone"],
    resistance: 4,
    dexterityRestriction: 1,
    reflexRestriction: 1,
    initiativeRestriction: 1,
    attributePenalty: 1,
    strengthRequirement: 2,
    block: 4
  },
  {
    name: "Duża  Tarcza+",
    description: "Ulepszona duża tarcza",
    tags: ["tarcze", "duże", "ulepszone"],
    resistance: 4,
    dexterityRestriction: 1,
    reflexRestriction: 1,
    initiativeRestriction: 1,
    attributePenalty: 1,
    strengthRequirement: 2,
    block: 4
  }
];

async function main() {
  console.log('🚀 Adding missing equipment items...\n');

  // Add missing weapons
  console.log('📖 Processing weapons...');
  const weapons: Weapon[] = JSON.parse(fs.readFileSync(WEAPONS_PATH, 'utf-8'));
  const weaponNames = new Set(weapons.map(w => w.name.toLowerCase()));
  
  let addedWeapons = 0;
  for (const weapon of MISSING_WEAPONS) {
    if (!weaponNames.has(weapon.name!.toLowerCase())) {
      weapons.push({
        id: ulid(),
        ...weapon as Weapon
      });
      addedWeapons++;
      console.log(`   ✅ Added: ${weapon.name}`);
    }
  }
  
  if (addedWeapons > 0) {
    fs.writeFileSync(WEAPONS_PATH, JSON.stringify(weapons, null, 2), 'utf-8');
    console.log(`   💾 Saved ${addedWeapons} new weapons\n`);
  } else {
    console.log(`   ⏭️  No new weapons to add\n`);
  }

  // Add missing armors
  console.log('📖 Processing armors...');
  const armors: Armor[] = JSON.parse(fs.readFileSync(ARMORS_PATH, 'utf-8'));
  const armorNames = new Set(armors.map(a => a.name.toLowerCase()));
  
  let addedArmors = 0;
  for (const armor of MISSING_ARMORS) {
    if (!armorNames.has(armor.name!.toLowerCase())) {
      armors.push({
        id: ulid(),
        ...armor as Armor
      });
      addedArmors++;
      console.log(`   ✅ Added: ${armor.name}`);
    }
  }
  
  if (addedArmors > 0) {
    fs.writeFileSync(ARMORS_PATH, JSON.stringify(armors, null, 2), 'utf-8');
    console.log(`   💾 Saved ${addedArmors} new armors\n`);
  } else {
    console.log(`   ⏭️  No new armors to add\n`);
  }

  // Add missing shields
  console.log('📖 Processing shields...');
  const shields: Shield[] = JSON.parse(fs.readFileSync(SHIELDS_PATH, 'utf-8'));
  const shieldNames = new Set(shields.map(s => s.name.toLowerCase()));
  
  let addedShields = 0;
  for (const shield of MISSING_SHIELDS) {
    if (!shieldNames.has(shield.name!.toLowerCase())) {
      shields.push({
        id: ulid(),
        ...shield as Shield
      });
      addedShields++;
      console.log(`   ✅ Added: ${shield.name}`);
    }
  }
  
  if (addedShields > 0) {
    fs.writeFileSync(SHIELDS_PATH, JSON.stringify(shields, null, 2), 'utf-8');
    console.log(`   💾 Saved ${addedShields} new shields\n`);
  } else {
    console.log(`   ⏭️  No new shields to add\n`);
  }

  console.log('📊 Summary:');
  console.log(`   New weapons: ${addedWeapons}`);
  console.log(`   New armors: ${addedArmors}`);
  console.log(`   New shields: ${addedShields}`);
  console.log(`   Total new items: ${addedWeapons + addedArmors + addedShields}\n`);

  console.log('🎉 Done!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
