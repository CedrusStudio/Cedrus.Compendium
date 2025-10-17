import { Item } from "@/domain/characters/equipment/Item";
import { ulid } from "ulid";

export type Mount = Item & 
{
  paceSpeed: number;
  gallopSpeed: number;
  canterSpeed: number;
  horsemanshipBonus: number;
};

export const defaultMount: Omit<Mount, "id"> =
{
  name: "Nowy wierzchowiec",
  description: "Opis wierzchowca",
  canterSpeed: 1,
  gallopSpeed: 1,
  horsemanshipBonus: 0,
  paceSpeed: 1
};

export const CreateDefaultMount = (): Mount => ({...defaultMount, id: ulid()});