import { defaultDiceGrade } from "@/domain/diceDefaults";
import { ulid } from "ulid";
import { Entity } from "@/domain/Entity";

export type Talent = Entity &
{
  grade: number;
  category: string;
  characteristics: string;
  bonus: number;
  penalty: TalentPenalty | null;
};

export type TalentPenalty = typeof allowedTalentPenalties[number];

export const allowedTalentPenalties = [ 
  "0",
  "x1", 
  "x1-1", 
  "x1-2", 
  "x1-3", 
  "x1+1", 
  "x1+2", 
  "x1+3", 
  "x2", 
  "x2-1", 
  "x2-2", 
  "x2-3", 
  "x2+1", 
  "x2+2", 
  "x2+3", 
  "x3", 
  "x4"
] as const satisfies readonly string[];

export const allowedTalentCategories = 
[
  "zmysł",
  "język",
  "fach",
  "wiedza",
  "sprawność",
  "talent"
] as const satisfies readonly string[];

export const allowedTalentCharacteristics = 
[
  "siła",
  "zręczność",
  "budowa",
  "umysł",
  "charyzma",
  "czarokrwistość"
] as const satisfies readonly string[];

export const allowedTalentSenses = 
[
  "wzrok",
  "słuch",
  "węch",
  "smak",
  "dotyk",
  "spostrzegawczość",
  "orientacja"
] as const satisfies readonly string[];

export const allowedTalentProficiencies =
[
  "pływanie",
  "wspinaczka",
  "akrobatyka",
  "skradanie",
  "kradzież kieszonkowa",
  "otwieranie zamków",
  "używanie lin",
  "oswobodzanie się",
  "zachowanie równowagi",
  "zręczna dłoń",
  "bezruch",
  "pierwsza pomoc",
  "sztuka przetrwania",
  "tropienie",
  "fałszerstwo",
  "kulinaria",
  "przeszukiwanie",
  "ukrywanie",
  "wycena",
  "używanie urządzeń",
  "aktorstwo",
  "blefowanie",
  "dyplomacja",
  "etykieta",
  "instrument muzyczny",
  "kuglarstwo",
  "retoryka",
  "śpiew",
  "taniec",
  "zwierzęca empatia",
  "występy sceniczne",
  "zastraszanie",
  "zbieranie informacji",
  "kontrola mocy",
] as const satisfies readonly string[];

export const allowedTalentScholarshipies = 
[
  "wiedza tajemna",
  "wiedza historyczna",
  "wiedza religijna",
  "wiedza przyrodnicza",
  "kowalstwo",
] as const satisfies readonly string[];

export const defaultTalent: Omit<Talent, "id"> =
{
  name: "Talent 1",
  category: "Kategoria",
  characteristics: "siła",
  bonus: 0,
  grade: defaultDiceGrade,
  penalty: null,
};

export const CreateDefaultTalent = (): Talent => ({...defaultTalent, id: ulid()});

export const basicTalents : Talent[] =
[
  // Zmysły
  {...CreateDefaultTalent(), name: "wzrok", category: "zmysł", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "słuch", category: "zmysł", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "węch", category: "zmysł", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "smak", category: "zmysł", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "dotyk", category: "zmysł", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "spostrzegawczość", category: "zmysł", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "orientacja", category: "zmysł", characteristics: "umysł"},

  // Języki
  {...CreateDefaultTalent(), name: "język boski", category: "język", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "język elficki", category: "język", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "język krasnoludzki", category: "język", characteristics: "umysł"},

  // Fachy
  {...CreateDefaultTalent(), name: "kradzież kieszonkowa", category: "fach", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "otwieranie zamków", category: "fach", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "pierwsza pomoc", category: "fach", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "tropienie", category: "fach", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "fałszerstwo", category: "fach", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "kulinaria", category: "fach", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "ukrywanie", category: "fach", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "wycena", category: "fach", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "używanie urządzeń", category: "fach", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "aktorstwo", category: "fach", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "instrument muzyczny", category: "fach", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "kuglarstwo", category: "fach", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "śpiew", category: "fach", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "taniec", category: "fach", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "występy sceniczne", category: "fach", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "kowalstwo", category: "fach", characteristics: "umysł"},

  // Wiedza
  {...CreateDefaultTalent(), name: "wiedza tajemna", category: "wiedza", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "wiedza historia", category: "wiedza", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "wiedza religia", category: "wiedza", characteristics: "umysł"},
  {...CreateDefaultTalent(), name: "wiedza natura", category: "wiedza", characteristics: "umysł"},

  // Sprawności
  {...CreateDefaultTalent(), name: "pływanie", category: "sprawność", characteristics: "siła"},
  {...CreateDefaultTalent(), name: "wspinaczka", category: "sprawność", characteristics: "siła"},
  {...CreateDefaultTalent(), name: "akrobatyka", category: "sprawność", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "skradanie", category: "sprawność", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "zachowanie równowagi", category: "sprawność", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "bezruch", category: "sprawność", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "używanie lin", category: "sprawność", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "zręczna dłoń", category: "sprawność", characteristics: "zręczność"},

  // Pozostałe (Talent)
  {...CreateDefaultTalent(), name: "przeszukiwanie", category: "talent", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "sztuka przetrwania", category: "talent", characteristics: "budowa"},
  {...CreateDefaultTalent(), name: "oswobodzanie się", category: "talent", characteristics: "zręczność"},
  {...CreateDefaultTalent(), name: "zwierzęca empatia", category: "talent", characteristics: "charyzma"},

  {...CreateDefaultTalent(), name: "zastraszanie", category: "talent", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "blefowanie", category: "talent", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "dyplomacja", category: "talent", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "etykieta", category: "talent", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "retoryka", category: "talent", characteristics: "charyzma"},
  {...CreateDefaultTalent(), name: "zbieranie informacji", category: "talent", characteristics: "charyzma"},
];


export const uniqueTalents : Talent[] =
[
  {...CreateDefaultTalent(), name: "kontrola mocy", category: "zmysł", characteristics: "czarokrwistość"}
]