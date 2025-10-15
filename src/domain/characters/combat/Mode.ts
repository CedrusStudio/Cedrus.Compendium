import { ulid } from "ulid";

export type Mode =
{
  readonly id: string;
  name: string;
  grade: number;
  description: string;
}

export type ModesType = "stances" | "states";

export const defaultStance: Omit<Mode, "id"> =
{
  name: 'Postawa',
  description: 'Opis postawy',
  grade: 1
};

export const defaultState: Omit<Mode, "id"> =
{
  name: 'Stan',
  description: 'Opis stanu',
  grade: 1
};

export const CreateDefaultStance = (): Mode => ({...defaultStance, id: ulid()});
export const CreateDefaultState = (): Mode => ({...defaultState, id: ulid()});