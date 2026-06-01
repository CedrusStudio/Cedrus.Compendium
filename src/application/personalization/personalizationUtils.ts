import { type PersonalizationContext, type QuickLink, type QuickLinkRoute } from '@/common/personalization/personalizationProfile';

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
  '/compendium/maneuvers': 'Manewry',
  '/compendium/stances': 'Postawy',
  '/compendium/states': 'Stany',
  '/compendium/perks': 'Atuty',
  '/compendium/powers': 'Moce',
  '/compendium/spells': 'Zaklecia',
  '/compendium/races': 'Rasy',
  '/compendium/equipment': 'Ekwipunek',
  '/compendium/equipment/weapons': 'Bronie',
  '/compendium/equipment/armors': 'Zbroje',
  '/compendium/equipment/shields': 'Tarcze',
  '/compendium/equipment/inventory': 'Przedmioty',
  '/compendium/equipment/mounts': 'Wierzchowce',
};

export const resolveQuickLinkHref = (quickLink: QuickLink) =>
{
  if (quickLink.type === 'character')
  {
    return `/characters/${quickLink.characterId}`;
  }

  return quickLink.href;
};