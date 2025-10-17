import { Entity } from "@/domain/Entity";
import { ulid } from "ulid";

export type Perk = Entity &
{
  grade: number;
  description: string;
  requirements?: string;
  price: number;
};

export const pathToPerkField = <K extends keyof Perk>(index: number, field: K): `perks.${number}.${K}` => `perks.${index}.${field}`;

export const defaultPerk: Omit<Perk, "id"> =
{
  name: "Perk",
  description: "Opis perku",
  grade: 1,
  requirements: "Wymagania",
  price: 1
};

export const CreateDefaultPerk = (): Perk => ({...defaultPerk, id: ulid()});