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
  paceSpeed: 1,
  tags: []
};

export const CreateDefaultMount = (): Mount => ({...defaultMount, id: ulid()});

export const allowedMountPaceSpeed = 
[ 
  0, 1, 2, 3, 4, 5
] as const satisfies readonly number[];

export const allowedMountGallopSpeed = 
[ 
  3, 4, 5, 6, 7, 8, 9, 10
] as const satisfies readonly number[];

export const allowedMountCenterSpeed = 
[ 
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
] as const satisfies readonly number[];

export const allowedHorsemanshipBonuses = 
[ 
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
] as const satisfies readonly number[];

