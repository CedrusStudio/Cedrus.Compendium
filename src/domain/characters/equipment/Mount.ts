import { Item } from "@/domain/characters/equipment/Item";

export type Mount = Item & 
{
  paceSpeed: number;
  gallopSpeed: number;
  canterSpeed: number;
  horsemanshipBonus: number;
};
