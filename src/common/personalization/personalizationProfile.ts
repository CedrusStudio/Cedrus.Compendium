import { BestiaryColumnPreferenceKey, resolveBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';

export const MAX_QUICK_TAGS_PER_CONTEXT = 5;

export const personalizationContexts = [
  'characters',
  'bestiary',
  'maneuvers',
  'stances',
  'states',
  'perks',
  'powers',
  'spells',
  'races',
  'weapons',
  'armors',
  'shields',
  'inventory',
  'mounts',
] as const;

export const quickLinkRoutes = [
  '/characters',
  '/characters/favorites',
  '/bestiary',
  '/compendium',
  '/compendium/maneuvers',
  '/compendium/stances',
  '/compendium/states',
  '/compendium/perks',
  '/compendium/powers',
  '/compendium/spells',
  '/compendium/races',
  '/compendium/equipment',
  '/compendium/equipment/weapons',
  '/compendium/equipment/armors',
  '/compendium/equipment/shields',
  '/compendium/equipment/inventory',
  '/compendium/equipment/mounts',
] as const;

export type PersonalizationContext = typeof personalizationContexts[number];
export type QuickLinkRoute = typeof quickLinkRoutes[number];
export type QuickTagsByContext = Partial<Record<PersonalizationContext, string[]>>;

export type QuickLink =
  | {
      id: string;
      label: string;
      type: 'route';
      href: QuickLinkRoute;
    }
  | {
      id: string;
      label: string;
      type: 'character';
      characterId: string;
    };

export type PersonalizationProfile = {
  userName?: string;
  bestiaryColumnVisibility?: Partial<Record<BestiaryColumnPreferenceKey, boolean>>;
  quickTagsByContext: QuickTagsByContext;
  quickExcludeTagsByContext: QuickTagsByContext;
  favoriteCharacterIds: string[];
  quickLinks: QuickLink[];
  mainCharacterId?: string;
};

export const createEmptyProfile = (): PersonalizationProfile => ({
  userName: undefined,
  bestiaryColumnVisibility: undefined,
  quickTagsByContext: {},
  quickExcludeTagsByContext: {},
  favoriteCharacterIds: [],
  quickLinks: [],
  mainCharacterId: undefined,
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isQuickLinkRoute = (value: unknown): value is QuickLinkRoute => typeof value === 'string' && quickLinkRoutes.includes(value as QuickLinkRoute);

const sanitizeQuickTagsByContext = (value: unknown): QuickTagsByContext => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([context, tags]) => personalizationContexts.includes(context as PersonalizationContext) && Array.isArray(tags))
      .map(([context, tags]) => [context, (tags as unknown[]).filter((tag): tag is string => typeof tag === 'string').slice(0, MAX_QUICK_TAGS_PER_CONTEXT)]),
  ) as QuickTagsByContext;
};

export const sanitizeProfile = (value: unknown): PersonalizationProfile => {
  if (!isRecord(value)) return createEmptyProfile();

  const quickTagsByContext = sanitizeQuickTagsByContext(value.quickTagsByContext);
  const quickExcludeTagsByContext = sanitizeQuickTagsByContext(value.quickExcludeTagsByContext);

  const favoriteCharacterIds = Array.isArray(value.favoriteCharacterIds)
    ? value.favoriteCharacterIds.filter((characterId): characterId is string => typeof characterId === 'string')
    : [];

  const quickLinks = Array.isArray(value.quickLinks)
    ? value.quickLinks.filter((quickLink): quickLink is QuickLink => {
        if (!isRecord(quickLink) || typeof quickLink.id !== 'string' || typeof quickLink.label !== 'string' || typeof quickLink.type !== 'string') {
          return false;
        }

        if (quickLink.type === 'route') {
          return isQuickLinkRoute(quickLink.href);
        }

        if (quickLink.type === 'character') {
          return typeof quickLink.characterId === 'string';
        }

        return false;
      })
    : [];

  const mainCharacterId = typeof value.mainCharacterId === 'string' && favoriteCharacterIds.includes(value.mainCharacterId)
    ? value.mainCharacterId
    : undefined;
  const userName = typeof value.userName === 'string' && value.userName.trim().length > 0 ? value.userName.trim() : undefined;
  const bestiaryColumnVisibility = isRecord(value.bestiaryColumnVisibility)
    ? resolveBestiaryColumnVisibility(value.bestiaryColumnVisibility as Partial<Record<BestiaryColumnPreferenceKey, boolean>>)
    : undefined;

  return {
    userName,
    bestiaryColumnVisibility,
    quickTagsByContext,
    quickExcludeTagsByContext,
    favoriteCharacterIds,
    quickLinks,
    mainCharacterId,
  };
};
