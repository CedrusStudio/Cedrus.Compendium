import { Entity } from "@/domain/Entity";
import { ulid } from "ulid";

export type Perk = Entity &
{
  grade: number;
  description: string;
  requirements?: string;
  price: number;
};

export const defaultPerk: Omit<Perk, "id"> =
{
  name: "Perk 1",
  description: "Opis perku 1",
  grade: 1,
  requirements: "Wymagania",
  price: 100
};

export const CreateDefaultPerk = (): Perk => ({...defaultPerk, id: ulid()});