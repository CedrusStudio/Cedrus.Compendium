
import { Character } from "@/domain/Character";
import { characterRepository } from '@/persistence/characterRepository';

const dummyCharacter : Character = 
{
  id: "dummy",
  name: "Dummy Character",
  description: "Aurelia Stormborn is a seasoned adventurer whose life has been shaped by the harsh realities of the frontier. Born to a family of scholars, she quickly distinguished herself with her keen intellect and insatiable curiosity. Her early years were spent poring over ancient tomes and deciphering forgotten languages, but a tragic loss forced her to leave the safety of her home and seek answers in the wider world.",
  characteristics: 
  {
    strength: { value: 0, grade: 3, bonus: 1, testBonus: 0 },
    dexterity: { value: 0, grade: 4, bonus: 2, testBonus: 0 },
    constitution: { value: 0, grade: 3, bonus: 1, testBonus: 0 },
    mind: { value: 0, grade: 5, bonus: 3, testBonus: 0 },
    charisma: { value: 0, grade: 2, bonus: 0, testBonus: 0 },
    spellborn: { value: 0, grade: 1, bonus: 0, testBonus: 0 }
  },
  attributes: 
  {
    fencing: { value: 1, grade: 3, bonus: 1, testBonus: 0 },
    artifice: { value: 0, grade: 2, bonus: 0, testBonus: 0 },
    precision: { value: 0, grade: 4, bonus: 0, testBonus: 0 },
    initiative: { value: 0, grade: 1, bonus: 0, testBonus: 0 },
    martialArt: { value: 0, grade: 5, bonus: 0, testBonus: 0 },
    horsemanship: { value: 0, grade: 2, bonus: 0, testBonus: 0 },

    fortitude: { value: 0, grade: 3, bonus: 0, testBonus: 0 },
    reflex: { value: 0, grade: 4, bonus: 1, testBonus: 0 },
    willpower: { value: 0, grade: 5, bonus: 0, testBonus: 0 }
  },
  talents: 
  [
    // Sense category
    { name: "perception", category: "sense", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "listening", category: "sense", characteristics: "mind", grade: 2, bonus: 0, penalty: 0 },
    { name: "smell", category: "sense", characteristics: "constitution", grade: 1, bonus: 0, penalty: 0 },
    { name: "taste", category: "sense", characteristics: "constitution", grade: 1, bonus: 0, penalty: 0 },
    { name: "direction sense", category: "sense", characteristics: "mind", grade: 2, bonus: 0, penalty: 0 },

    // Language category
    { name: "divine", category: "language", characteristics: "mind", grade: 1, bonus: 0, penalty: 0 },
    { name: "elvish", category: "language", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "dwarvish", category: "language", characteristics: "mind", grade: 2, bonus: 0, penalty: 0 },
    { name: "fey", category: "language", characteristics: "mind", grade: 1, bonus: 0, penalty: 0 },

    // Proficiency category
    { name: "swimming", category: "proficiency", characteristics: "constitution", grade: 2, bonus: 0, penalty: 0 },
    { name: "climbing", category: "proficiency", characteristics: "strength", grade: 3, bonus: 0, penalty: 0 },
    { name: "acrobatics", category: "proficiency", characteristics: "dexterity", grade: 3, bonus: 0, penalty: 0 },
    { name: "stealth", category: "proficiency", characteristics: "dexterity", grade: 4, bonus: 1, penalty: 0 },
    { name: "pickpocketing", category: "proficiency", characteristics: "dexterity", grade: 2, bonus: 0, penalty: 0 },
    { name: "lockpicking", category: "proficiency", characteristics: "dexterity", grade: 3, bonus: 0, penalty: 0 },
    { name: "rope use", category: "proficiency", characteristics: "dexterity", grade: 2, bonus: 0, penalty: 0 },
    { name: "escape artist", category: "proficiency", characteristics: "dexterity", grade: 2, bonus: 0, penalty: 0 },
    { name: "balance", category: "proficiency", characteristics: "dexterity", grade: 3, bonus: 0, penalty: 0 },
    { name: "sleight of hand", category: "proficiency", characteristics: "dexterity", grade: 2, bonus: 0, penalty: 0 },
    { name: "stillness", category: "proficiency", characteristics: "constitution", grade: 2, bonus: 0, penalty: 0 },
    { name: "first aid", category: "proficiency", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "survival", category: "proficiency", characteristics: "mind", grade: 4, bonus: 1, penalty: 0 },
    { name: "tracking", category: "proficiency", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "forgery", category: "proficiency", characteristics: "mind", grade: 1, bonus: 0, penalty: 0 },
    { name: "cooking", category: "proficiency", characteristics: "mind", grade: 2, bonus: 0, penalty: 0 },
    { name: "search", category: "proficiency", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "hide", category: "proficiency", characteristics: "dexterity", grade: 3, bonus: 0, penalty: 0 },
    { name: "appraise", category: "proficiency", characteristics: "mind", grade: 2, bonus: 0, penalty: 0 },
    { name: "use device", category: "proficiency", characteristics: "mind", grade: 2, bonus: 0, penalty: 0 },
    { name: "acting", category: "proficiency", characteristics: "charisma", grade: 2, bonus: 0, penalty: 0 },
    { name: "bluff", category: "proficiency", characteristics: "charisma", grade: 3, bonus: 0, penalty: 0 },
    { name: "diplomacy", category: "proficiency", characteristics: "charisma", grade: 4, bonus: 1, penalty: 0 },
    { name: "etiquette", category: "proficiency", characteristics: "charisma", grade: 3, bonus: 0, penalty: 0 },
    { name: "musical instrument", category: "proficiency", characteristics: "dexterity", grade: 2, bonus: 0, penalty: 0 },
    { name: "juggling", category: "proficiency", characteristics: "dexterity", grade: 1, bonus: 0, penalty: 0 },
    { name: "rhetoric", category: "proficiency", characteristics: "charisma", grade: 3, bonus: 0, penalty: 0 },
    { name: "singing", category: "proficiency", characteristics: "charisma", grade: 2, bonus: 0, penalty: 0 },
    { name: "dancing", category: "proficiency", characteristics: "dexterity", grade: 2, bonus: 0, penalty: 0 },
    { name: "animal handling", category: "proficiency", characteristics: "charisma", grade: 3, bonus: 0, penalty: 0 },
    { name: "performance", category: "proficiency", characteristics: "charisma", grade: 2, bonus: 0, penalty: 0 },
    { name: "intimidation", category: "proficiency", characteristics: "charisma", grade: 2, bonus: 0, penalty: 0 },
    { name: "gather information", category: "proficiency", characteristics: "charisma", grade: 3, bonus: 0, penalty: 0 },
    { name: "animal empathy", category: "proficiency", characteristics: "charisma", grade: 2, bonus: 0, penalty: 0 },
    { name: "inner power", category: "proficiency", characteristics: "spellborn", grade: 1, bonus: 0, penalty: 0 },

    // Scholarship category
    { name: "ancient lore", category: "scholarship", characteristics: "mind", grade: 4, bonus: 1, penalty: 0 },
    { name: "arcane knowledge", category: "scholarship", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "history", category: "scholarship", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "religion", category: "scholarship", characteristics: "mind", grade: 2, bonus: 0, penalty: 0 },
    { name: "nature", category: "scholarship", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "blacksmithing", category: "scholarship", characteristics: "strength", grade: 1, bonus: 0, penalty: 0 },
    { name: "carpentry", category: "scholarship", characteristics: "strength", grade: 1, bonus: 0, penalty: 0 },
    { name: "alchemy", category: "scholarship", characteristics: "mind", grade: 2, bonus: 0, penalty: 0 },
    { name: "herbalism", category: "scholarship", characteristics: "mind", grade: 3, bonus: 0, penalty: 0 },
    { name: "merchant", category: "profession", characteristics: "charisma", grade: 2, bonus: 0, penalty: 0 },
    { name: "soldier", category: "profession", characteristics: "constitution", grade: 2, bonus: 0, penalty: 0 },
    { name: "scholar", category: "profession", characteristics: "mind", grade: 4, bonus: 1, penalty: 0 }
  ],
  health: 
  { 
    vitality: 10,
    toughness: 5,
    recoveryLevel: 1,
    lethalHealthLevel: 0,
    lethalHealthLevelRounds: 0,
    barrier: 0,
    bonus: 0
  },
  defense: 
  {
    immunity: 0,
    resistance: 0,
    protection: 5,
    block: 2,
    parry: 1,
    dodge: 0,
    bonus: 0
  },
  offense:
  {
    leadingWeapon: 
    {
      amount: 2,
      grade: 3,
      bonus: 1,
      critical: 
      {
        power: 2,
        range: 1
      }
    },
    secondaryWeapon:
    {
      amount: 1,
      grade: 2,
      bonus: 2,
      critical: 
      {
        power: 3,
        range: 5
      }
    },
    damageBonus: 
    {
      amount: 1,
      grade: 3,
      bonus: 5
    }
  },
  stances: 
  [
    {
      name: "Defensive Stance",
      grade: 3,
      description: "Increases protection by 4 and reduces damage by 3."
    },
    {
      name: "Fencing Stance",
      grade: 2,
      description: "Increases fencing by 2."
    }
  ],
  states:
  [
    {
      name: "rage",
      grade: 1,
      description: "Add 3 strength and 3 constitution."
    }
  ],
  equipment:
  {
    armor:
    {
      name: "Leather Armor",
      description: "A sturdy leather armor offering moderate protection.",
      protection: 5,
      dexterityRestriction: 0,
      reflexRestriction: 0,
      initiativeRestriction: 0,
      attributePenalty: 0,
      strengthRequirement: 0
    },
    shield:
    {
      name: "Wooden Shield",
      description: "A basic wooden shield offering minimal protection.",
      block: 2,
      dexterityRestriction: 0,
      reflexRestriction: 0,
      initiativeRestriction: 0,
      attributePenalty: 0,
      strengthRequirement: 0
    },
    weapon1: 
    {
      name: "Short Sword",
      description: "A basic short sword.",
      style: "One-Handed",
      offense: {
        amount: 1,
        grade: 3,
        bonus: 1,
        critical: {
          power: 1,
          range: 1
        },
      },
      damageBonus:
      {
        amount: 1,
        grade: 3,
        bonus: 5
      },
      range: 1
    },
    weapon2:
    {
      name: "Long Bow",
      description: "A sturdy long bow.",
      style: "Ranged",
      offense: {
        amount: 1,
        grade: 2,
        bonus: 0,
        critical: {
          power: 2,
          range: 5
        }
      },
      damageBonus: {
        amount: 1,
        grade: 2,
        bonus: 0
      },
      range: 5
    },
    weapon3:
    {
      name: "Magic Staff",
      description: "A staff imbued with magical properties.",
      style: "Two-Handed",
      offense: {
        amount: 1,
        grade: 4,
        bonus: 2,
        critical: {
          power: 3,
          range: 10
        }
      },
      damageBonus: {
        amount: 1,
        grade: 4,
        bonus: 2
      },
      range: 10
    },
    magicEquipment: 
    [
      {
        name: "Ring of Power",
        description: "A magical ring that grants the wearer increased strength.",
        immunity: 1,
        reduction: 2,
        resistance: 3,
      },
      {
        name: "Amulet of Wisdom",
        description: "An amulet that enhances the wearer's intellect.",
        immunity: 0,
        reduction: 1,
        resistance: 2
      }
    ]
  },
};

export default function seedDatabase() 
{
  console.log("Database seeded!");
  characterRepository.upsert(dummyCharacter);
}