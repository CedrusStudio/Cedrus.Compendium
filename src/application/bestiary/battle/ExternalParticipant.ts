import { Statistic } from "@prisma/client";

export type ExternalParticipant = 
{
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  currentInitiative: number | null;
  initiative: Statistic;
  notes?: string;
  isExternal: true; // Discriminator to distinguish from Character
};

export function createExternalParticipant
(
  name: string,
  maxHealth: number = 100,
  initiativeGrade: number = 3,
  initiativeTotalBonus: number = 0,
  notes: string = ""
)
  : ExternalParticipant 
{
  return {
    id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    name,
    health: maxHealth,
    maxHealth,
    currentInitiative: null,
    initiative: { grade: initiativeGrade, value: initiativeTotalBonus, bonus: 0, testBonus: 0 } as Statistic,
    notes,
    isExternal: true,
  };
}

export function updateExternalParticipant(participant: ExternalParticipant, updates: Partial<Omit<ExternalParticipant, 'id' | 'isExternal'>>)
  : ExternalParticipant 
{
  return {
    ...participant,
    ...updates,
  };
}
