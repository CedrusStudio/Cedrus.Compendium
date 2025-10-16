import { Entity } from "@/domain/Entity";

export type Perk = Entity &
{
  grade: number;
  description: string;
  requirements?: string;
  price: number;
}