import { Entity } from "@/domain/Entity";
import { ulid } from "ulid";
import { Tag } from "@/domain/Tag";

export type Perk = Entity &
{
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: Tag[];
};

export const pathToPerkField = <K extends keyof Perk>(index: number, field: K): `perks.${number}.${K}` => `perks.${index}.${field}`;
export const pathToPerk = (index: number): `perks.${number}` => `perks.${index}`;

export const defaultPerk: Omit<Perk, "id"> =
{
  name: "Perk",
  description: "Opis perku",
  grade: 1,
  requirements: [],
  price: 1,
  tags: []
};

export const CreateDefaultPerk = (): Perk => ({...defaultPerk, id: ulid()});