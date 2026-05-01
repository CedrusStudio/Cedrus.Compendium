import { PersonalizationContext, QuickLink, QuickLinkRoute } from '@/persistence/slices/personalizationSlice';

export const personalizationContextLabels: Record<PersonalizationContext, string> = {
  characters: 'Postacie',
  bestiary: 'Bestiariusz',
  maneuvers: 'Manewry',
  stances: 'Postawy',
  states: 'Stany',
  perks: 'Atuty',
  powers: 'Moce',
  spells: 'Zaklecia',
  races: 'Rasy',
  weapons: 'Bron',
  armors: 'Zbroje',
  shields: 'Tarcze',
  inventory: 'Przedmioty',
  mounts: 'Wierzchowce',
};

export const personalizationRouteLabels: Record<QuickLinkRoute, string> = {
  '/characters': 'Lista postaci',
  '/characters/favorites': 'Ulubione postacie',
  '/bestiary': 'Bestiariusz',
  '/compendium': 'Kompendium',
  '/compendium/perks': 'Atuty',
  '/compendium/powers': 'Moce',
  '/compendium/spells': 'Zaklecia',
};

export const resolveQuickLinkHref = (quickLink: QuickLink) =>
{
  if (quickLink.type === 'character')
  {
    return `/characters/${quickLink.characterId}`;
  }

  return quickLink.href;
};