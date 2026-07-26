import { Entity } from "@/domain/Entity";
import { ulid } from "ulid";
import { Tag } from "@/domain/Tag";
import { Requirement } from "@/domain/requirements/Requirement";

export type Perk = Entity &
{
  grade: number;
  description: string;
  /**
   * Structured requirements (Wave 5 — the sole requirements model after the
   * legacy `requirements: string[]` cutover). Optional — absent on records that
   * have none. Flows to Maneuver, Mode (stance/state) and Spell, which extend Perk.
   */
  structuredRequirements?: Requirement[];
  /**
   * Names of entities this one REPLACES (ROADMAP 8.6). The library authored
   * these as requirement texts ("Zastępuje Młyniec"), but a replacement is a
   * relation between entities, not a condition on the character — it never
   * belonged among requirements. Optional; absent on records that replace nothing.
   */
  replaces?: string[];
  price: number;
  tags: Tag[];
};

export const pathToPerkField = <K extends keyof Perk>(index: number, field: K): `perks.${number}.${K}` => `perks.${index}.${field}`;
export const pathToPerk = (index: number): `perks.${number}` => `perks.${index}`;

export const defaultPerk: Omit<Perk, "id"> =
{
  name: "Perk",
  description: "Opis perku",
  grade: 1,
  price: 1,
  tags: []
};

export const CreateDefaultPerk = (): Perk => ({...defaultPerk, id: ulid()});