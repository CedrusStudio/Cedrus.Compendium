import { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';

export const requirementEntityModelMap: Record<RequirementEntityType, string> = {
  spells: 'spell',
  perks: 'perk',
  maneuvers: 'maneuver',
  stances: 'stance',
  states: 'state',
};

export const isValidRequirementValue = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 && trimmedValue.length <= 1000;
};