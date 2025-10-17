import { ulid } from "ulid";
import { Castable } from '@/domain/characters/Castable';
import { Perk } from "@/domain/characters/Perk";

export type Maneuver = Perk & Castable;

export const defaultManeuver: Omit<Maneuver, "id"> =
{ 
  name: 'Manewr', 
  grade: 1, 
  description: 'Opis manewru', 
  castTime: "Standardowa", 
  cooldown: 1,
  price: 1,
  requirements: "Brak"
};

export const CreateDefaultManeuver = (): Maneuver => ({...defaultManeuver, id: ulid()});