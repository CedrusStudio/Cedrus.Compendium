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

export const allowedTalentLanguages =
[
  "boski",
  "elficki",
  "krasnoludzki",
  "wróżowski"
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
  penalty: null
};

export const CreateDefaultTalent = (): Talent => ({...defaultTalent, id: ulid()});