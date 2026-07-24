import { ulid } from "ulid";
import { Perk } from "@/domain/characters/Perk";
import type { Effect } from "@/domain/combat-lab/effects/Effect";

/**
 * A stance ("postawa") or state ("stan"): a `Perk` with a `grade` (rank).
 * Each rank is a separate record with its own authored effects; "raising the
 * rank by 1" swaps to the grade+1 sibling (see combat-lab engine-model-gaps §1).
 * The Combat Lab reads `effects`; legacy records have none (inert in the sim).
 */
export type Mode = Perk &
{
  /** Structured, engine-readable effects (Combat Lab). Absent on legacy records. */
  effects?: Effect[];
  /** Simulation triage: undefined = unassessed, true = usable, false = excluded. */
  simulatable?: boolean;
  /** Why an unsupported mode cannot be simulated. */
  unsupportedReason?: string;
};
export type ModesType = "stances" | "states";

export const defaultStance: Omit<Mode, "id"> =
{
  name: 'Postawa',
  description: 'Opis postawy',
  grade: 1,
  requirements: [],
  price: 0,
  tags: []
};

export const defaultState: Omit<Mode, "id"> =
{
  name: 'Stan',
  description: 'Opis stanu',
  grade: 1,
  requirements: [],
  price: 0,
  tags: []
};

export const CreateDefaultStance = (): Mode => ({...defaultStance, id: ulid()});
export const CreateDefaultState = (): Mode => ({...defaultState, id: ulid()});

export const pathToModeField = <K extends keyof Mode>(index: number, modeType: ModesType, field: K): `${ModesType}.${number}.${K}` => `${modeType}.${index}.${field}`;
export const pathToMode = (index: number, modeType: ModesType): `${ModesType}.${number}` => `${modeType}.${index}`;