
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
  talents: [],
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
        }
      },
      range: 1
    },
    magicEquipment: []
  },
};

export default function seedDatabase() 
{
  characterRepository.upsert(dummyCharacter);
}