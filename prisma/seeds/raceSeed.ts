import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

const sampleRaces = [
  {
    id: ulid(),
    name: "Człowiek",
    description: "Ludzie są najbardziej uniwersalną rasą, bez szczególnych mocnych ani słabych stron. Ich zdolność adaptacji i wszechstronność czyni ich doskonałym wyborem dla każdej klasy postaci.",
    tags: ["podstawowa", "uniwersalna"],
    strengthModifier: 0,
    dexterityModifier: 0,
    constitutionModifier: 0,
    mindModifier: 0,
    charismaModifier: 0,
    spellbornModifier: 0
  },
  {
    id: ulid(),
    name: "Elf",
    description: "Elfy są smukłe i zwinne, z wrodzoną łatwością w operowaniu magią. Ich długie życie pozwala im zgłębiać tajniki wiedzy i mistycznych sztuk, choć ich delikatna budowa czyni ich mniej odpornymi fizycznie.",
    tags: ["podstawowa", "magia", "zwinność"],
    strengthModifier: -1,
    dexterityModifier: 2,
    constitutionModifier: -1,
    mindModifier: 1,
    charismaModifier: 1,
    spellbornModifier: 2
  },
  {
    id: ulid(),
    name: "Krasnolud",
    description: "Krasnoludowie są niskiego wzrostu, ale niezwykle silni i wytrzymali. Ich życie w podziemnych fortecach ukształtowało ich jako mistrzów rzemiosła i niezłomnych wojowników, choć brakuje im naturalnej zręczności i finezji.",
    tags: ["podstawowa", "siła", "wytrzymałość"],
    strengthModifier: 2,
    dexterityModifier: -1,
    constitutionModifier: 2,
    mindModifier: 0,
    charismaModifier: -1,
    spellbornModifier: -1
  },
  {
    id: ulid(),
    name: "Niziołek",
    description: "Niziołki są małe, zwinne i niezwykle szczęśliwe. Ich niska postawa i szybkość sprawiają, że są świetnymi łotrzami i zwiadowcami, choć nie wyróżniają się siłą fizyczną ani odpornością.",
    tags: ["podstawowa", "zwinność", "szczęście"],
    strengthModifier: -2,
    dexterityModifier: 2,
    constitutionModifier: -1,
    mindModifier: 0,
    charismaModifier: 1,
    spellbornModifier: 0
  },
  {
    id: ulid(),
    name: "Ork",
    description: "Orkowie to potężni i agresywni wojownicy o masywnej budowie. Ich dzikie pochodzenie czyni ich naturalnymi łowcami i berserkerami, jednak ich intelekt i charyzma są często niedoceniane przez cywilizowane rasy.",
    tags: ["podstawowa", "siła", "dzikość"],
    strengthModifier: 3,
    dexterityModifier: 0,
    constitutionModifier: 2,
    mindModifier: -2,
    charismaModifier: -2,
    spellbornModifier: -1
  },
  {
    id: ulid(),
    name: "Półelf",
    description: "Półelfy łączą w sobie cechy ludzi i elfów, dziedzicząc zwinność i urok elfów przy zachowaniu ludzkiej wszechstronności. Są dobrze przyjmowani w większości społeczeństw.",
    tags: ["mieszana", "uniwersalna"],
    strengthModifier: 0,
    dexterityModifier: 1,
    constitutionModifier: 0,
    mindModifier: 0,
    charismaModifier: 1,
    spellbornModifier: 1
  },
  {
    id: ulid(),
    name: "Tiefling",
    description: "Tieflinge noszą w sobie krew piekielnych przodków, co objawia się rogami, ogonem i niezwykłą odpornością na magię. Ich demoniczne pochodzenie często wywołuje strach i nieufność.",
    tags: ["egzotyczna", "magia", "infernalna"],
    strengthModifier: 0,
    dexterityModifier: 1,
    constitutionModifier: 1,
    mindModifier: 1,
    charismaModifier: 2,
    spellbornModifier: 2
  },
  {
    id: ulid(),
    name: "Dragonborn",
    description: "Potomkowie starożytnych smoków, Dragonbornowie łączą ludzką posturę z smoczą mocą. Ich łuski chronią ich w walce, a wrodzona magia ognia czyni ich groźnymi przeciwnikami.",
    tags: ["egzotyczna", "smocza", "siła"],
    strengthModifier: 2,
    dexterityModifier: 0,
    constitutionModifier: 2,
    mindModifier: 0,
    charismaModifier: 1,
    spellbornModifier: 1
  }
];

export async function seedRaces() {
  console.log(`Seeding races...`);

  await prisma.race.deleteMany({});
  console.log(`Deleted existing races`);

  let count = 0;
  for (const race of sampleRaces) {
    await prisma.race.create({ data: race });
    count++;
    console.log(`  Seeded race: ${race.name}`);
  }
  console.log(`✅ Seeded ${count} races`);
}

seedRaces()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Race seeding completed');
  });
