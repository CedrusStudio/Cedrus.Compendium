import { Tag } from "@/domain/Tag";
import { Entity } from "@/domain/Entity";
import { ulid } from "ulid";

export type Race = Entity &
{
  description: string;
  tags: Tag[];
  strengthModifier: number;
  dexterityModifier: number;
  constitutionModifier: number;
  mindModifier: number;
  charismaModifier: number;
  spellbornModifier: number;
};

export const pathToRaceField = <K extends keyof Race>(
  index: number, 
  field: K
): `races.${number}.${K}` => `races.${index}.${field}`;

export const pathToRace = (index: number): `races.${number}` => `races.${index}`;

export const defaultRace: Omit<Race, "id"> = {
  name: "Nowa rasa",
  description: "Opis rasy",
  strengthModifier: 0,
  dexterityModifier: 0,
  constitutionModifier: 0,
  mindModifier: 0,
  charismaModifier: 0,
  spellbornModifier: 0,
  tags: []
};

export const CreateDefaultRace = (): Race => ({...defaultRace, id: ulid()});
