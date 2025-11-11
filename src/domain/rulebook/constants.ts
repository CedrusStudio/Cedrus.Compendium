import type { RulebookCategory } from './RulebookTypes';

/**
 * Main categories of the Cedrus Rulebook
 */
export const RULEBOOK_CATEGORIES: RulebookCategory[] = 
[
  {
    id: 'podstawy',
    title: 'Podstawy',
    description: 'Mechaniki bazowe systemu: testy, kości, obrażenia, rundy i akcje',
    icon: '🎲',
    order: 1,
    slug: 'podstawy'
  },
  {
    id: 'cechy-i-umiejetnosci',
    title: 'Cechy i Umiejętności',
    description: 'Atrybuty postaci, umiejętności bojowe, obronne i nadnaturalne',
    icon: '⚔️',
    order: 2,
    slug: 'cechy-i-umiejetnosci'
  },
  {
    id: 'system-walki',
    title: 'System Walki',
    description: 'Mechanika walki, style, taktyka, organizacja i manewry bojowe',
    icon: '🛡️',
    order: 3,
    slug: 'system-walki'
  },
  {
    id: 'magia-i-zaklecia',
    title: 'Magia i Zaklęcia',
    description: 'Zasady czarowania, łańcuchy zaklęć, siła zaklęć i magia obszarowa',
    icon: '✨',
    order: 4,
    slug: 'magia-i-zaklecia'
  },
  {
    id: 'zdrowie-i-regeneracja',
    title: 'Zdrowie i Regeneracja',
    description: 'Punkty życia, leczenie, regeneracja esencji i efekty krytyczne',
    icon: '❤️',
    order: 5,
    slug: 'zdrowie-i-regeneracja'
  }
];

/**
 * Mapping of folder names to category IDs
 */
export const FOLDER_TO_CATEGORY = 
{
  '01-Podstawy': 'podstawy',
  '02-Cechy-i-Umiejętności': 'cechy-i-umiejetnosci',
  '03-System-Walki': 'system-walki',
  '04-Magia-i-Zaklęcia': 'magia-i-zaklecia',
  '05-Zdrowie-i-Regeneracja': 'zdrowie-i-regeneracja'
} as const;

/**
 * Get category by ID
 */
export function getCategoryById(id: string): RulebookCategory | undefined 
{
  return RULEBOOK_CATEGORIES.find(cat => cat.id === id);
}

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string): RulebookCategory | undefined
{
  return RULEBOOK_CATEGORIES.find(cat => cat.slug === slug);
}
