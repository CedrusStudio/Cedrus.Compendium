import { ulid } from "ulid";
import { Perk } from "@/domain/characters/Perk";

export type Mode = Perk;
export type ModesType = "stances" | "states";

export const defaultStance: Omit<Mode, "id"> =
{
  name: 'Postawa',
  description: 'Opis postawy',
  grade: 1,
  requirements: 'Brak',
  price: 0,
  tags: []
};

export const defaultState: Omit<Mode, "id"> =
{
  name: 'Stan',
  description: 'Opis stanu',
  grade: 1,
  requirements: 'Brak',
  price: 0,
  tags: []
};

export const CreateDefaultStance = (): Mode => ({...defaultStance, id: ulid()});
export const CreateDefaultState = (): Mode => ({...defaultState, id: ulid()});