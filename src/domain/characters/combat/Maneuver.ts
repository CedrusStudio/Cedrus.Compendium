import { ulid } from "ulid";
import { Castable } from '@/domain/characters/Castable';
import { Perk } from "@/domain/characters/Perk";
import type { Effect } from "@/domain/combat-lab/effects/Effect";

export type Maneuver = Perk & Castable &
{
  /**
   * Structured, engine-readable effects (Combat Lab). Absent on legacy records
   * that have not been authored yet; the simulation lifts those with no effect.
   */
  effects?: Effect[];
  /**
   * Simulation triage: `undefined` = not yet assessed, `true` = usable in the
   * simulator, `false` = deliberately excluded (see `unsupportedReason`).
   */
  simulatable?: boolean;
  /** Why an unsupported maneuver cannot be simulated (out-of-combat subsystem). */
  unsupportedReason?: string;
};

export const defaultManeuver: Omit<Maneuver, "id"> =
{ 
  name: 'Manewr', 
  grade: 1, 
  description: 'Opis manewru', 
  castTime: "Standardowa", 
  cooldown: 1,
  price: 1,
  tags: []
};

export const CreateDefaultManeuver = (): Maneuver => ({...defaultManeuver, id: ulid()});

export const pathToManeuverField = <K extends keyof Maneuver>(index: number, field: K): `maneuvers.${number}.${K}` => `maneuvers.${index}.${field}`;
export const pathToManeuvers = (index: number): `maneuvers.${number}` => `maneuvers.${index}`;
