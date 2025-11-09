import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const igarStances = [
  {
    id: '01K744551FTKKC4VRH0QYCATCX',
    name: 'Obronna',
    grade: 3,
    description: 'Zwiększa pancerz o 4 i redukuje obrażenia o 3.',
    price: 2,
    requirements: [],
    tags: [],
  },
  {
    id: '01K7445QFVSXXW7QR4VJFM2G9F',
    name: 'Fechmistrza',
    grade: 2,
    description: 'Zwiększa fechtunek o 2.',
    price: 1,
    requirements: ['Fechtunek 2.'],
    tags: [],
  },
];

export const igarStates = [
  {
    id: '01K744613NPQ5E0502A0TA1D4R',
    name: 'Szał',
    grade: 1,
    description: 'Dodaje 3 siły i 3 kondycji.',
    price: 2,
    requirements: ['Siła 3', 'Kondycja 3'],
    tags: [],
  },
];

export const igarManeuvers = [
  {
    id: '01K7448TY7XXTSW2YRKHW8WS3K',
    name: 'Potężny atak',
    grade: 2,
    description: 'Potężny atak wręcz zadający dodatkowe obrażenia.',
    cooldown: 1,
    castTime: 'Standardowa',
    price: 2,
    requirements: ['Siła 3.'],
    tags: [],
  },
  {
    id: '01K74494WXSM8H9HCB0S5DZ812',
    name: 'Szybki strzał',
    grade: 1,
    description: 'Szybki atak dystansowy o zmniejszonej celności.',
    cooldown: 1,
    castTime: 'Natychmiastowa',
    price: 1,
    requirements: ['Zręczność 2.'],
    tags: [],
  },
  {
    id: '01K7449C9HW968KT4AAEF9NJD6',
    name: 'Rozpraszający cios',
    grade: 3,
    description: 'Atak rozpraszający cel, zmniejszający celność jego następnego ataku.',
    cooldown: 1,
    castTime: 'Standardowa',
    price: 2,
    requirements: ['Fechtunek 3.'],
    tags: [],
  },
  {
    id: '01K7449MEABF3JMDTHMGY8JZK1',
    name: 'Ruch skoczka',
    grade: 2,
    description:
      'Poruszanie się w kształcie litery L, jak skoczek w szachach, ignorując trudny teren.',
    cooldown: undefined,
    castTime: 'Standardowa',
    price: 1,
    requirements: ['Zręczność 3.'],
    tags: [],
  },
  {
    id: '01K7449WNVWTCG7HG81Q6VHVRH',
    name: 'Unik toczny',
    grade: 3,
    description:
      'Wykonaj przewrót aby uniknąć nadchodzącego ataku, zwiększając unik na jedną rundę.',
    cooldown: 1,
    castTime: 'Nadnatychmiastowa',
    price: 2,
    requirements: ['Zręczność 4.'],
    tags: [],
  },
  {
    id: '01K744A431BWP2P047GKCCQ04Z',
    name: 'Uderzenie tarczą',
    grade: 1,
    description: 'Użyj tarczy aby uderzyć przeciwnika, potencjalnie go ogłuszając.',
    cooldown: 3,
    castTime: 'Standardowa',
    price: 1,
    requirements: ['Blokowanie 1.'],
    tags: [],
  },
  {
    id: '01K744ACFM6GMECG1CA36W2WCB',
    name: 'Karząca cięcie',
    grade: 2,
    description:
      'Potężne cięcie zadające dodatkowe obrażenia celowi który był już trafiony wiele razy.',
    cooldown: 4,
    castTime: 'Standardowa',
    price: 2,
    requirements: ['Fechtunek 4.'],
    tags: [],
  },
  {
    id: '01K744AKB7F7NAR6E4EZM4ND29',
    name: 'Wir ciosów',
    grade: 4,
    description: 'Zaatakuj wszystkich przyległych wrogów w jednym, zamaszystym ruchu.',
    cooldown: 3,
    castTime: 'Pełnorundowa',
    price: 3,
    requirements: ['Fechtunek 5.', 'Siła 4.'],
    tags: [],
  },
  {
    id: '01K744ASTGM6HM5XP0RJSS73BE',
    name: 'Finta',
    grade: 1,
    description:
      'Zwodniczy ruch powodujący opuszczenie straży przez przeciwnika, czyniąc go bardziej podatnym na twój następny atak.',
    cooldown: 1,
    castTime: 'Standardowa',
    price: 1,
    requirements: ['Fortel 5.', 'Szybki Cios 3.'],
    tags: [],
  },
  {
    id: '01K744B0NR4015W4HHJF459RA2',
    name: 'Rozbrajające uderzenie',
    grade: 3,
    description:
      'Precyzyjny atak mający na celu rozbrojenie przeciwnika, zmuszający go do upuszczenia broni.',
    cooldown: 6,
    castTime: 'Standardowa',
    price: 3,
    requirements: ['Fechtunek 4.', 'Siła 3.'],
    tags: [],
  },
  {
    id: '01K744B6AGRV911646MSVPPV42',
    name: 'Ruch zabójcy',
    grade: 4,
    description:
      'Poruszaj się cicho i niewidzialnie, zyskując przewagę w następnym ataku jeśli pozostaniesz niewykryty.',
    cooldown: undefined,
    castTime: 'Standardowa',
    price: 2,
    requirements: ['Skradanie 4.', 'Zręczność 4.'],
    tags: [],
  },
];

export const igarAllSpells = [
  {
    id: '01K7PXSAJXNQ45BJEN1RC9BSK7',
    name: 'Kula ognia',
    grade: 2,
    description: 'Rzuca kulę ognia na przeciwnika, zadając obrażenia od ognia.',
    cost: 40,
    castTime: 'Standardowa',
    cooldown: 1,
    price: 2,
    requirements: ['Czarokrwistość 2.'],
    tags: [],
  },
  {
    id: '01K7PXV3A6VHQR0J17SV42SC6V',
    name: 'Ogniste Grzyby',
    grade: 3,
    description: 'Rzuca ogniste grzyby na przeciwnika, piekąc go.',
    cost: 20,
    castTime: 'Standardowa',
    cooldown: 3,
    price: 4,
    requirements: ['Czarokrwistość 2.'],
    tags: [],
  },
  {
    id: '01K7PXXAFBE3FNS370D2SACZ3F',
    name: 'Wodna Bariera',
    grade: 3,
    description: 'Rzuca barierę wody dodając 20 redukcji.',
    cost: 20,
    castTime: 'Natychmiastowa',
    cooldown: 1,
    price: 2,
    requirements: ['Czarokrwistość 4.'],
    tags: [],
  },
  {
    id: '01K7PXXE59XP9PD2S4EKGWPCS2',
    name: 'Wodne Hydry',
    grade: 3,
    description: 'Rzuca wodne hydry na przeciwnika, topiąc go.',
    cost: 40,
    castTime: 'Standardowa',
    cooldown: 3,
    price: 4,
    requirements: ['Czarokrwistość 2.'],
    tags: [],
  },
];

export const igarPerks = [
  {
    id: '01K7QBPPMV75XF8BM164F5FGJK',
    name: 'Nieustraszony',
    description: 'Odporność na strach i efekty zastraszania.',
    price: 3,
    grade: 2,
    requirements: ['Charyzma 3.', 'Siła Woli 3.'],
    tags: [],
  },
  {
    id: '01K7QBQD019HCMK48X7VCVEAXS',
    name: 'Mocarność',
    description: 'Dodaje 2 do twardości.',
    price: 6,
    grade: 3,
    requirements: ['Budowa 3.'],
    tags: [],
  },
  {
    id: '01K7QBREAHB6NTEC55DPHV55PV',
    name: 'Szybka regeneracja',
    description: 'Regeneruje dodatkowe 2 punkty życia na rundę.',
    price: 4,
    grade: 2,
    requirements: ['Budowa 4.'],
    tags: [],
  },
  {
    id: '01K7QBRQXNT0T64NF434PK32N0',
    name: 'Zadziorność',
    description: 'Zwiększa szansę na krytyczny hit o 5%.',
    price: 5,
    grade: 2,
    requirements: ['Zręczność 4.'],
    tags: [],
  },
];

export async function seedCombat() 
{
  console.log(`Seeding combat...`);

  // Delete existing combat entities
  await prisma.stance.deleteMany({ where: { id: { in: igarStances.map((stance) => stance.id) } } });
  await prisma.state.deleteMany({ where: { id: { in: igarStates.map((state) => state.id) } } });
  await prisma.perk.deleteMany({ where: { id: { in: igarPerks.map((perk) => perk.id) } } });
  await prisma.maneuver.deleteMany({ where: { id: { in: igarManeuvers.map((maneuver) => maneuver.id) } } });
  await prisma.spell.deleteMany({ where: { id: { in: igarAllSpells.map((spell) => spell.id) } } });

  // Seed perks
  console.log(`Seeding perks...`);
  for (const perk of igarPerks) 
  {
    console.log(`Seeding perk: ${perk.name} with id ${perk.id}`);
    const result = await prisma.perk.create({ data: perk });
    console.log(`Created perk with id: ${result.id}`);
  }

  // Seed maneuvers
  console.log(`Seeding maneuvers...`);
  for (const maneuver of igarManeuvers) 
  {
    console.log(`Seeding maneuver: ${maneuver.name} with id ${maneuver.id}`);
    const result = await prisma.maneuver.create({ data: maneuver });
    console.log(`Created maneuver with id: ${result.id}`);
  }

  // Seed spells
  console.log(`Seeding spells...`);
  for (const spell of igarAllSpells) 
  {
    console.log(`Seeding spell: ${spell.name} with id ${spell.id}`);
    const result = await prisma.spell.create({ data: spell });
    console.log(`Created spell with id: ${result.id}`);
  }

  // Seed stances
  console.log(`Seeding stances...`);
  for (const stance of igarStances) 
  {
    console.log(`Seeding stance: ${stance.name} with id ${stance.id}`);
    const result = await prisma.stance.create({ data: stance });
    console.log(`Created stance with id: ${result.id}`);
  }

  // Seed states
  console.log(`Seeding states...`);
  for (const state of igarStates) 
  {
    console.log(`Seeding state: ${state.name} with id ${state.id}`);
    const result = await prisma.state.create({ data: state });
    console.log(`Created state with id: ${result.id}`);
  }

  console.log(`Combat seeding finished.`);
}
