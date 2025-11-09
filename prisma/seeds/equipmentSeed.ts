import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const igarArmors = [
  {
    id: '01K7446AT4AJDHD781W7HJRFM0',
    name: 'Skórzana zbroja',
    description: 'Solidna skórzana zbroja oferująca umiarkowaną ochronę.',
    protection: 5,
    immunity: 0,
    resistance: 2,
    dexterityRestriction: 0,
    reflexRestriction: 0,
    initiativeRestriction: 0,
    attributePenalty: 0,
    strengthRequirement: 0,
    tags: [],
  },
  {
    id: '01K7446JMED4FDXT8P2HJN24R7',
    name: 'Płytowa zbroja',
    description: 'Solidna skórzana zbroja oferująca umiarkowaną ochronę.',
    protection: 5,
    immunity: 2,
    resistance: 5,
    dexterityRestriction: 0,
    reflexRestriction: 0,
    initiativeRestriction: 0,
    attributePenalty: 0,
    strengthRequirement: 0,
    tags: [],
  },
];

export const igarShields = [
  {
    id: '01K7446V1QTA5N9T18HX8HYV3P',
    name: 'Drewniana tarcza',
    description: 'Podstawowa drewniana tarcza oferująca minimalną ochronę.',
    block: 2,
    resistance: 1,
    dexterityRestriction: 0,
    reflexRestriction: 0,
    initiativeRestriction: 0,
    attributePenalty: 0,
    strengthRequirement: 0,
    tags: [],
  },
  {
    id: '01K74472BA6RE2ZQPW7DW3YB59',
    name: 'Skórzana tarcza',
    description: 'Podstawowa skórzana tarcza oferująca minimalną ochronę.',
    block: 2,
    resistance: 0,
    dexterityRestriction: 0,
    reflexRestriction: 0,
    initiativeRestriction: 0,
    attributePenalty: 0,
    strengthRequirement: 0,
    tags: [],
  },
];

export const igarWeapons = [
  {
    id: '01K7447B6A22DPE9DAZZQ2PYP9',
    name: 'Krótki miecz',
    description: 'Podstawowy krótki miecz.',
    style: 'Jednoręczny',
    offense: {
      amount: 1,
      grade: 3,
      bonus: 1,
      critical: {
        power: 1,
        range: 1,
      },
    },
    damageBonus: {
      amount: 1,
      grade: 3,
      bonus: 5,
    },
    range: 1,
    tags: [],
  },
  {
    id: '01K7447J0QZAS6DC6200B6ZT8J',
    name: 'Długi łuk',
    description: 'Solidny długi łuk.',
    style: 'Dystansowy',
    offense: {
      amount: 1,
      grade: 2,
      bonus: 0,
      critical: {
        power: 2,
        range: 5,
      },
    },
    damageBonus: {
      amount: 1,
      grade: 2,
      bonus: 0,
    },
    range: 5,
    tags: [],
  },
  {
    id: '01K7447RTBKVXSATM8SSG08G9F',
    name: 'Magiczny kostur',
    description: 'Kostur nasycony magicznymi właściwościami.',
    style: 'Dwuręczny',
    offense: {
      amount: 1,
      grade: 4,
      bonus: 2,
      critical: {
        power: 3,
        range: 10,
      },
    },
    damageBonus: {
      amount: 1,
      grade: 4,
      bonus: 2,
    },
    range: 10,
    tags: [],
  },
];

export const igarInventory = [
  {
    id: '01K7447ZQHM520R1MJX74J0FZ9',
    name: 'Pierścień mocy',
    description: 'Magiczny pierścień który zwiększa siłę użytkownika.',
    tags: [],
  },
  {
    id: '01K74488VYD3MCD6MYV6FEQY0B',
    name: 'Amulet mądrości',
    description: 'Amulet który zwiększa intelekt użytkownika.',
    tags: [],
  },
];

export const igarMounts = [
  {
    id: '01K7448JKAACX01W42XJY0FF2Y',
    name: 'Czarny ogier',
    description: 'Silny i szybki koń bojowy.',
    canterSpeed: 6,
    gallopSpeed: 12,
    paceSpeed: 3,
    horsemanshipBonus: 2,
    tags: [],
  },
];

export async function seedEquipment() 
{
  console.log(`Seeding equipment...`);

  // Delete existing equipment
  await prisma.weapon.deleteMany({ where: { id: { in: igarWeapons.map((weapon) => weapon.id) } } });
  await prisma.armor.deleteMany({ where: { id: { in: igarArmors.map((armor) => armor.id) } } });
  await prisma.shield.deleteMany({ where: { id: { in: igarShields.map((shield) => shield.id) } } });
  await prisma.inventoryItem.deleteMany({  where: { id: { in: igarInventory.map((item) => item.id) } } });
  await prisma.mount.deleteMany({ where: { id: { in: igarMounts.map((mount) => mount.id) } } });

  // Seed weapons
  console.log(`Seeding weapons...`);
  for (const weapon of igarWeapons) 
  {
    console.log(`Seeding weapon: ${weapon.name} with id ${weapon.id}`);
    const result = await prisma.weapon.create({ data: weapon });
    console.log(`Created weapon with id: ${result.id}`);
  }

  // Seed armors
  console.log(`Seeding armors...`);
  for (const armor of igarArmors) 
{
    console.log(`Seeding armor: ${armor.name} with id ${armor.id}`);
    const result = await prisma.armor.create({ data: armor });
    console.log(`Created armor with id: ${result.id}`);
  }

  // Seed shields
  console.log(`Seeding shields...`);
  for (const shield of igarShields) 
  {
    console.log(`Seeding shield: ${shield.name} with id ${shield.id}`);
    const result = await prisma.shield.create({ data: shield });
    console.log(`Created shield with id: ${result.id}`);
  }

  // Seed inventory items
  console.log(`Seeding inventory items...`);
  for (const item of igarInventory) 
  {
    console.log(`Seeding inventory item: ${item.name} with id ${item.id}`);
    const result = await prisma.inventoryItem.create({ data: item });
    console.log(`Created inventory item with id: ${result.id}`);
  }

  // Seed mounts
  console.log(`Seeding mounts...`);
  for (const mount of igarMounts) 
  {
    console.log(`Seeding mount: ${mount.name} with id ${mount.id}`);
    const result = await prisma.mount.create({ data: mount });
    console.log(`Created mount with id: ${result.id}`);
  }

  console.log(`Equipment seeding finished.`);
}
