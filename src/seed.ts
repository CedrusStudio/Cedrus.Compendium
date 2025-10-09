
import { Character } from "@/domain/characters/Character";
import { upsertCharacter } from '@/persistence/characterRepository';

const dummyCharacter : Character = 
{
  id: "igar",
  name: "Igar Potworobójca",
  category: "Bohater",
  description: "Igar Potworobójca bohater wielu opowieści, znany z niezwykłej odwagi i siły. Jego przygody są legendą wśród mieszkańców krainy. Poza tym zawsze szuka zaczepki, chociaż może nawet nie jest tego świadom.",
  characteristics: 
  {
    strength: { value: 2, grade: 3, bonus: 1, testBonus: 2 },
    dexterity: { value: 1, grade: 4, bonus: 2, testBonus: 0 },
    constitution: { value: 5, grade: 3, bonus: 1, testBonus: 4 },
    mind: { value: 2, grade: 5, bonus: 3, testBonus: 1 },
    charisma: { value: -2, grade: 2, bonus: 0, testBonus: 5 },
    spellborn: { value: -1, grade: 1, bonus: 0, testBonus: -3 }
  },
  attributes: 
  {
    fencing: { value: 1, grade: 3, bonus: 1, testBonus: 2 },
    artifice: { value: -1, grade: 2, bonus: 4, testBonus: 1 },
    precision: { value: 1, grade: 4, bonus: 1, testBonus: 3 },
    initiative: { value: 5, grade: 1, bonus: -3, testBonus: 0 },
    martialArt: { value: 3, grade: 5, bonus: 0, testBonus: -1 },
    horsemanship: { value: 3, grade: 2, bonus: 0, testBonus: 0 },

    fortitude: { value: 4, grade: 3, bonus: -1, testBonus: 0 },
    reflex: { value: 2, grade: 4, bonus: 1, testBonus: 0 },
    willpower: { value: 3, grade: 5, bonus: 0, testBonus: 0 }
  },
  talents: 
  [
    // Kategoria: zmysł
    { id: "01K74NMVKTSWMEM9R3V774KWQQ", name: "spostrzegawczość", category: "zmysł", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NMYYE0XRPJ105FBY1Y5A9", name: "słuch", category: "zmysł", characteristics: "umysł", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NN24KNFX2SJ94V7359J33", name: "węch", category: "zmysł", characteristics: "kondycja", grade: 1, bonus: 0, penalty: 0 },
    { id: "01K74NN4FNYZRTXX2CHCTMTTKT", name: "smak", category: "zmysł", characteristics: "kondycja", grade: 1, bonus: 0, penalty: 0 },
    { id: "01K74NN84FY0G278T0KTCA2RQ6", name: "orientacja", category: "zmysł", characteristics: "umysł", grade: 2, bonus: 0, penalty: 0 },

    // Kategoria: język
    { id: "01K74NNAM14DBFGP7TT1ZWHJZ0", name: "boskie", category: "język", characteristics: "umysł", grade: 1, bonus: 0, penalty: 0 },
    { id: "01K74NND975F57VHP65SC070WP", name: "elfickie", category: "język", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NNFW0D113VEBY4VHZP0HS", name: "krasnoludzkie", category: "język", characteristics: "umysł", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NNJM46VX8A0Q7WGBRTNJM", name: "baśniowe", category: "język", characteristics: "umysł", grade: 1, bonus: 0, penalty: 0 },

    // Kategoria: sprawność
    { id: "01K74NNPGVC3B12ZFXWCSQXG7M", name: "pływanie", category: "sprawność", characteristics: "kondycja", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NNRYRKKQQ9HV0VZTA9JFC", name: "wspinaczka", category: "sprawność", characteristics: "siła", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NNVXPGX3EC2KSY6EZEA6R", name: "akrobatyka", category: "sprawność", characteristics: "zręczność", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NNYM1ZFKTJ9YSJTN0TKWK", name: "skradanie", category: "sprawność", characteristics: "zręczność", grade: 4, bonus: 1, penalty: 0 },
    { id: "01K74NP12SBT7DZ82X54PYPF1H", name: "kieszonkarstwo", category: "sprawność", characteristics: "zręczność", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NP41S7VZ6XM5TNZR10P5V", name: "włamywanie", category: "sprawność", characteristics: "zręczność", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NP6KV73Q7NB3BY2VNX6YQ", name: "posługiwanie liną", category: "sprawność", characteristics: "zręczność", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NPAPQFZ06KNQY7XZRXKWM", name: "ucieczka", category: "sprawność", characteristics: "zręczność", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NPD2KY7F4Q276KYR2DWP8", name: "równowaga", category: "sprawność", characteristics: "zręczność", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NPFGKZRXVD4S21FJRWE3H", name: "zręczność dłoni", category: "sprawność", characteristics: "zręczność", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NPJVD5PE2G5Y8EYWD4MK8", name: "nieruchomość", category: "sprawność", characteristics: "kondycja", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NPN7V328W63WMMSKYMFCK", name: "pierwsza pomoc", category: "sprawność", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NPSA23TA4V4HDGCZQYEQ5", name: "przetrwanie", category: "sprawność", characteristics: "umysł", grade: 4, bonus: 1, penalty: 0 },
    { id: "01K74NPW4AP3G1NA506NKSTMNC", name: "tropienie", category: "sprawność", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NPYQ2NM027J3FA0HEZMM9", name: "fałszerstwo", category: "sprawność", characteristics: "umysł", grade: 1, bonus: 0, penalty: 0 },
    { id: "01K74NQ149SWE0CV53FDCFZAV5", name: "gotowanie", category: "sprawność", characteristics: "umysł", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NQ3K67VVVB9HPCBEVZ3Y1", name: "przeszukiwanie", category: "sprawność", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NQ5QBXVW77HMMH6DPXYTT", name: "ukrywanie", category: "sprawność", characteristics: "zręczność", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NQ7ZVESVGHP9DC55NZ3WH", name: "wycena", category: "sprawność", characteristics: "umysł", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NQA8BKCCMMNSC9HWZXEJ8", name: "obsługa urządzenia", category: "sprawność", characteristics: "umysł", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NQE4SPBTGRG7AWTEASBDP", name: "aktorstwo", category: "sprawność", characteristics: "charyzma", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NQGETBTFAWRF7M1E9CHWS", name: "blef", category: "sprawność", characteristics: "charyzma", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NQJY78BZRSEPP9163H1T2", name: "dyplomacja", category: "sprawność", characteristics: "charyzma", grade: 4, bonus: 1, penalty: 0 },
    { id: "01K74NQNFDEFYM5R3TWW2SNBGD", name: "etykieta", category: "sprawność", characteristics: "charyzma", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NQR3NEK7PSVA7P57FMQ2T", name: "instrument muzyczny", category: "sprawność", characteristics: "zręczność", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NQVD9Q7ZH8DK4HVG47DQT", name: "żonglerka", category: "sprawność", characteristics: "zręczność", grade: 1, bonus: 0, penalty: 0 },
    { id: "01K74NQY1Q7XQAHR92MEPEQEPM", name: "retoryka", category: "sprawność", characteristics: "charyzma", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NR0G3DJ109P5N6QB0RDAB", name: "śpiew", category: "sprawność", characteristics: "charyzma", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NR2PSSFZ51Y7473EC914K", name: "taniec", category: "sprawność", characteristics: "zręczność", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NR56DZ2BA4DXQHP10S5BK", name: "tresura", category: "sprawność", characteristics: "charyzma", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NR7N3F3V3BSCXMXM9F3Q3", name: "występ", category: "sprawność", characteristics: "charyzma", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NRA32J7Y8PCMCH7TKKT9X", name: "zastraszanie", category: "sprawność", characteristics: "charyzma", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NRCJ143YZ8KXGGZ1367TB", name: "zbieranie informacji", category: "sprawność", characteristics: "charyzma", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NRHPAWM79Q16YGP1GTJ9J", name: "empatia zwierzęca", category: "sprawność", characteristics: "charyzma", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NRN77QJ37Y5206HVKY1N5", name: "moc wewnętrzna", category: "sprawność", characteristics: "czarokrwistość", grade: 1, bonus: 0, penalty: 0 },

    // Kategoria: wiedza
    { id: "01K74NRXZYA6X89FR6N41QBJA3", name: "starożytna wiedza", category: "wiedza", characteristics: "umysł", grade: 4, bonus: 1, penalty: 0 },
    { id: "01K74NS2BZK5V41A1279QV9X5W", name: "wiedza tajemna", category: "wiedza", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NS5SQ6PP51HNNRYVB5Z58", name: "historia", category: "wiedza", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NS8111Y6XSV98WB7HXPEF", name: "religia", category: "wiedza", characteristics: "umysł", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NSABKE6X9S3AMN17PRV94", name: "natura", category: "wiedza", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },

    // Kategoria: fach
    { id: "01K74NSD678ZEDD91E6CECDV3T", name: "kowalstwo", category: "fach", characteristics: "siła", grade: 1, bonus: 0, penalty: 0 },
    { id: "01K74NSGEB0QFPYHKNKHSB779A", name: "stolarstwo", category: "fach", characteristics: "siła", grade: 1, bonus: 0, penalty: 0 },
    { id: "01K74NSK7SRA83V4GQ7VV90FVS", name: "alchemia", category: "fach", characteristics: "umysł", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NSNP3YHHAZW5G6MVVKC2N", name: "zielarstwo", category: "fach", characteristics: "umysł", grade: 3, bonus: 0, penalty: 0 },
    { id: "01K74NSRKQS8J53SPY763VNYF3", name: "kupiec", category: "fach", characteristics: "charyzma", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NSVH3146A1PJ64VCT3BAY", name: "żołnierz", category: "fach", characteristics: "kondycja", grade: 2, bonus: 0, penalty: 0 },
    { id: "01K74NSXYNHC3E3B3NTR9VPBWX", name: "uczony", category: "fach", characteristics: "umysł", grade: 4, bonus: 1, penalty: 0 }
  ],
  health: 
  { 
    vitality: 10,
    toughness: 5,
    recoveryLevel: 1,
    lethalHealth: 10,
    lethalRounds: 2,
    barrier: 5,
    bonus: 2
  },
  defenses:
  [
    {
      id: '01K7444EVT610S2M3TB4X23TW3',
      name: "Lekkozbrojny",
      description: "Lekka zbroja i mała tarcza oferujące podstawową ochronę przy zachowaniu mobilności.",
      immunity: 0,
      resistance: 0,
      protection: 5,
      block: 2,
      parry: 1,
      dodge: 0,
      bonus: 0
    },
    {
      id: '01K7444Q84VF317M9NJPH9DVZ9',
      name: "Ciężkozbrojny",
      description: "Ciężka zbroja i duża tarcza oferujące maksymalną ochronę.",
      immunity: 2,
      resistance: 4,
      protection: 3,
      block: 5,
      parry: 2,
      dodge: 3,
      bonus: 1
    }
  ],
  offenses:
  [
    {
      id: '01K7444VR7F0FNR6SBTMTQE3SM',
      name: "Duale",
      description: "Dwa ostre miecze Kabdulu.",
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
    {
      id: '01K744500ZWWX2P276BS9TDQX1',
      name: "Topór archerski",
      description: "Topór przeznaczony do walki na bliski dystans.",
      leadingWeapon: 
      {
        amount: 1,
        grade: 8,
        bonus: 3,
        critical: 
        {
          power: 2,
          range: 3
        }
      },
      damageBonus: 
      {
        amount: 1,
        grade: 5,
        bonus: 2
      }
    }
  ],
  stances: 
  [
    {
      id: '01K744551FTKKC4VRH0QYCATCX',
      name: "Obronna",
      grade: 3,
      description: "Zwiększa pancerz o 4 i redukuje obrażenia o 3."
    },
    {
      id: '01K7445QFVSXXW7QR4VJFM2G9F',
      name: "Fechmistrza",
      grade: 2,
      description: "Zwiększa fechtunek o 2."
    }
  ],
  states:
  [
    {
      id: '01K744613NPQ5E0502A0TA1D4R',
      name: "Szał",
      grade: 1,
      description: "Dodaje 3 siły i 3 kondycji."
    }
  ],
  equipment:
  {
    armors:
    [
      {
        id: '01K7446AT4AJDHD781W7HJRFM0',
        name: "Skórzana zbroja",
        description: "Solidna skórzana zbroja oferująca umiarkowaną ochronę.",
        protection: 5,
        immunity: 0,
        resistance: 2,
        dexterityRestriction: 0,
        reflexRestriction: 0,
        initiativeRestriction: 0,
        attributePenalty: 0,
        strengthRequirement: 0
      },
      {
        id: '01K7446JMED4FDXT8P2HJN24R7',
        name: "Płytowa zbroja",
        description: "Solidna skórzana zbroja oferująca umiarkowaną ochronę.",
        protection: 5,
        immunity: 2,
        resistance: 5,
        dexterityRestriction: 0,
        reflexRestriction: 0,
        initiativeRestriction: 0,
        attributePenalty: 0,
        strengthRequirement: 0
      },
    ],
    shields:
    [
      {
        id: '01K7446V1QTA5N9T18HX8HYV3P',
        name: "Drewniana tarcza",
        description: "Podstawowa drewniana tarcza oferująca minimalną ochronę.",
        block: 2,
        resistance: 1,
        dexterityRestriction: 0,
        reflexRestriction: 0,
        initiativeRestriction: 0,
        attributePenalty: 0,
        strengthRequirement: 0
      },
      {
        id: '01K74472BA6RE2ZQPW7DW3YB59',
        name: "Skórzana tarcza",
        description: "Podstawowa skórzana tarcza oferująca minimalną ochronę.",
        block: 2,
        resistance: 0,
        dexterityRestriction: 0,
        reflexRestriction: 0,
        initiativeRestriction: 0,
        attributePenalty: 0,
        strengthRequirement: 0
      }
    ],
    weapons: 
    [
      {
        id: '01K7447B6A22DPE9DAZZQ2PYP9',
        name: "Krótki miecz",
        description: "Podstawowy krótki miecz.",
        style: "Jednoręczny",
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
      {
        id: '01K7447J0QZAS6DC6200B6ZT8J',
        name: "Długi łuk",
        description: "Solidny długi łuk.",
        style: "Dystansowy",
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
      {
        id: '01K7447RTBKVXSATM8SSG08G9F',
        name: "Magiczny kostur",
        description: "Kostur nasycony magicznymi właściwościami.",
        style: "Dwuręczny",
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
      }
    ],
    inventory: 
    [
      {
        id: '01K7447ZQHM520R1MJX74J0FZ9',
        name: "Pierścień mocy",
        description: "Magiczny pierścień który zwiększa siłę użytkownika.",
      },
      {
        id: '01K74488VYD3MCD6MYV6FEQY0B',
        name: "Amulet mądrości",
        description: "Amulet który zwiększa intelekt użytkownika."
      }
    ],
    horses: 
    [
      {
        id: '01K7448JKAACX01W42XJY0FF2Y',
        name: "Czarny ogier",
        description: "Silny i szybki koń bojowy.",
        canterSpeed: 6,
        gallopSpeed: 12,
        paceSpeed: 3,
        horsemanshipBonus: 2
      }
    ]
  },
  maneuvers:
  [
    {
      id: '01K7448TY7XXTSW2YRKHW8WS3K',
      name: "Potężny atak",
      grade: 2,
      description: "Potężny atak wręcz zadający dodatkowe obrażenia.",
      cooldown: 1,
      castTime: "Standardowa"
    },
    {
      id: '01K74494WXSM8H9HCB0S5DZ812',
      name: "Szybki strzał",
      grade: 1,
      description: "Szybki atak dystansowy o zmniejszonej celności.",
      cooldown: 1,
      castTime: "Natychmiastowa"
    },
    {
      id: '01K7449C9HW968KT4AAEF9NJD6',
      name: "Rozpraszający cios",
      grade: 3,
      description: "Atak rozpraszający cel, zmniejszający celność jego następnego ataku.",
      cooldown: 1,
      castTime: "Standardowa"
    },
    {
      id: '01K7449MEABF3JMDTHMGY8JZK1',
      name: "Ruch skoczka",
      grade: 2,
      description: "Poruszanie się w kształcie litery L, jak skoczek w szachach, ignorując trudny teren.",
      cooldown: undefined,
      castTime: "Standardowa"
    },
    {
      id: '01K7449WNVWTCG7HG81Q6VHVRH',
      name: "Unik toczny",
      grade: 3,
      description: "Wykonaj przewrót aby uniknąć nadchodzącego ataku, zwiększając unik na jedną rundę.",
      cooldown: 1,
      castTime: "Nadnatychmiastowa"
    },
    {
      id: '01K744A431BWP2P047GKCCQ04Z',
      name: "Uderzenie tarczą",
      grade: 1,
      description: "Użyj tarczy aby uderzyć przeciwnika, potencjalnie go ogłuszając.",
      cooldown: 3,
      castTime: "Standardowa"
    },
    {
      id: '01K744ACFM6GMECG1CA36W2WCB',
      name: "Karząca cięcie",
      grade: 2,
      description: "Potężne cięcie zadające dodatkowe obrażenia celowi który był już trafiony wiele razy.",
      cooldown: 4,
      castTime: "Standardowa"
    },
    {
      id: '01K744AKB7F7NAR6E4EZM4ND29',
      name: "Wir ciosów",
      grade: 4,
      description: "Zaatakuj wszystkich przyległych wrogów w jednym, zamaszystym ruchu.",
      cooldown: 3,
      castTime: "Pełnorundowa"
    },
    { 
      id: '01K744ASTGM6HM5XP0RJSS73BE',
      name: "Finta",
      grade: 1,
      description: "Zwodniczy ruch powodujący opuszczenie straży przez przeciwnika, czyniąc go bardziej podatnym na twój następny atak.",
      cooldown: 1,
      castTime: "Standardowa"
    },
    {
      id: '01K744B0NR4015W4HHJF459RA2',
      name: "Rozbrajające uderzenie",
      grade: 3,
      description: "Precyzyjny atak mający na celu rozbrojenie przeciwnika, zmuszający go do upuszczenia broni.",
      cooldown: 6,
      castTime: "Standardowa"
    },
    {
      id: '01K744B6AGRV911646MSVPPV42',
      name: "Ruch zabójcy",
      grade: 4,
      description: "Poruszaj się cicho i niewidzialnie, zyskując przewagę w następnym ataku jeśli pozostaniesz niewykryty.",
      cooldown: undefined,
      castTime: "Standardowa"
    }
  ]
};

export default async function seedDatabase() 
{
  console.log("Database seeded!");
  await upsertCharacter(dummyCharacter);
}