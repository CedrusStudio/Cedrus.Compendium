"use client";

import { createCharacterCacheKeys } from '@/application/characters/edit/editFormConstants';
import { Character } from '@/domain/characters/Character';
import { BuffProfile, DamageOffenseBuff, StatisticBuff, WeaponOffenseBuff } from '@/domain/characters/buffs/BuffProfile';
import client from '@/infrastructure/clients/charactersClient';
import { useFormMutation } from '@/infrastructure/hooks/useFormMutation';
import { BuffsDto } from '@/persistence/schemas/characters/buffs/buffsSchema';
import { displayedText } from '@/common/translations';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/common/components/ui/collapsible';
import { ChevronDown, Sparkles, Zap, Heart, Shield, Swords } from 'lucide-react';
import { useEffect, useState } from 'react';

type CharacterBuffsViewProps =
{
  character: Character;
  selectedStanceId?: string;
  selectedStateId?: string;
};

type ModifierProfilesFieldName = 'buffProfiles' | 'stanceModifierProfiles' | 'stateModifierProfiles' | 'otherModifierProfiles';
type ActiveModifierProfileIdsFieldName = 'activeBuffProfileIds' | 'activeStanceModifierProfileIds' | 'activeStateModifierProfileIds' | 'activeOtherModifierProfileIds';

type ModifierCategoryConfig =
{
  title: string;
  profilesFieldName: ModifierProfilesFieldName;
  activeIdsFieldName: ActiveModifierProfileIdsFieldName;
};

const modifierCategories: ModifierCategoryConfig[] =
[
  {
    title: displayedText.buffs,
    profilesFieldName: 'buffProfiles',
    activeIdsFieldName: 'activeBuffProfileIds',
  },
  {
    title: displayedText.stances,
    profilesFieldName: 'stanceModifierProfiles',
    activeIdsFieldName: 'activeStanceModifierProfileIds',
  },
  {
    title: displayedText.states,
    profilesFieldName: 'stateModifierProfiles',
    activeIdsFieldName: 'activeStateModifierProfileIds',
  },
  {
    title: displayedText.otherModifiers,
    profilesFieldName: 'otherModifierProfiles',
    activeIdsFieldName: 'activeOtherModifierProfileIds',
  },
] as const;

export default function CharacterBuffsView({ character, selectedStanceId, selectedStateId }: CharacterBuffsViewProps)
{
  const [selectedProfileIds, setSelectedProfileIds] = useState<Record<ModifierProfilesFieldName, string>>(() => createSelectedProfileIdsState(character));

  useEffect(() =>
  {
    setSelectedProfileIds(createSelectedProfileIdsState(character));
  }, [character]);

  useEffect(() =>
  {
    setSelectedProfileIds(previousValue =>
    {
      const nextValue = { ...previousValue };
      let changed = false;

      const linkedStanceProfileId = resolveLinkedProfileId(character.stanceModifierProfiles, selectedStanceId);
      if (linkedStanceProfileId && linkedStanceProfileId !== previousValue.stanceModifierProfiles)
      {
        nextValue.stanceModifierProfiles = linkedStanceProfileId;
        changed = true;
      }

      const linkedStateProfileId = resolveLinkedProfileId(character.stateModifierProfiles, selectedStateId);
      if (linkedStateProfileId && linkedStateProfileId !== previousValue.stateModifierProfiles)
      {
        nextValue.stateModifierProfiles = linkedStateProfileId;
        changed = true;
      }

      return changed ? nextValue : previousValue;
    });
  }, [character.stanceModifierProfiles, character.stateModifierProfiles, selectedStanceId, selectedStateId]);

  const { handleSubmit, isPending } = useFormMutation<BuffsDto>
  (
    async (data) => await client.updateBuffs(character.id, data),
    {
      invalidateOnSuccess: createCharacterCacheKeys(character.id),
      toastPosition: 'bottom-left',
    }
  );

  const handleApply = (profilesFieldName: ModifierProfilesFieldName, activeIdsFieldName: ActiveModifierProfileIdsFieldName) =>
  {
    const selectedProfileId = selectedProfileIds[profilesFieldName];
    const activeProfileIds = character[activeIdsFieldName];

    if (!selectedProfileId)
    {
      return;
    }

    handleSubmit(createBuffsPayload(character, {
      [activeIdsFieldName]: activeProfileIds.includes(selectedProfileId)
        ? activeProfileIds
        : [...activeProfileIds, selectedProfileId],
    }));
  };

  const handleWithdraw = (profilesFieldName: ModifierProfilesFieldName, activeIdsFieldName: ActiveModifierProfileIdsFieldName) =>
  {
    const selectedProfileId = selectedProfileIds[profilesFieldName];

    if (!selectedProfileId)
    {
      return;
    }

    handleSubmit(createBuffsPayload(character, {
      [activeIdsFieldName]: character[activeIdsFieldName].filter(profileId => profileId !== selectedProfileId),
    }));
  };

  return (
    <Card className='bg-muted w-full min-w-0'>
      <CardHeader className='gap-3 min-w-0'>
        <div className='flex flex-col gap-2'>
          <CardTitle className='text-2xl font-bold capitalize'>{displayedText.buffs}</CardTitle>
          <div className='flex flex-wrap gap-2'>
            {
              modifierCategories.map(category => {
                const activeProfiles = getModifierProfiles(character, category.profilesFieldName)
                  .filter(profile => getActiveProfileIds(character, category.activeIdsFieldName).includes(profile.id));

                return (
                  <Badge key={category.title} variant={activeProfiles.length > 0 ? 'default' : 'outline'} className='w-fit'>
                    {`${category.title}: ${activeProfiles.length}`}
                  </Badge>
                );
              })
            }
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='grid gap-4 xl:grid-cols-2 min-w-0'>
          {
            modifierCategories.map(category => {
              const profiles = getModifierProfiles(character, category.profilesFieldName);
              const activeProfileIds = getActiveProfileIds(character, category.activeIdsFieldName);
              const selectedProfileId = selectedProfileIds[category.profilesFieldName];
              const selectedProfile = profiles.find(profile => profile.id === selectedProfileId) ?? profiles[0];
              const activeProfiles = profiles.filter(profile => activeProfileIds.includes(profile.id));
              const modifierSections = selectedProfile ? collectBuffProfileModifierSections(selectedProfile) : [];
              const modifierCount = modifierSections.reduce((total, section) => total + section.modifiers.length, 0);
              const selectedLinkedEntityId = resolveSelectedLinkedEntityId(category.profilesFieldName, selectedStanceId, selectedStateId);
              const isSelectedProfileLinkedToCurrentMode = Boolean(selectedProfile?.linkedEntityId && selectedProfile.linkedEntityId === selectedLinkedEntityId);
              const linkedEntityName = selectedProfile ? resolveLinkedEntityName(character, category.profilesFieldName, selectedProfile.linkedEntityId) : undefined;

              return (
                <ModifierCategoryCard
                  key={category.title}
                  title={category.title}
                  profiles={profiles}
                  activeProfiles={activeProfiles}
                  selectedProfile={selectedProfile}
                  selectedProfileId={selectedProfileId}
                  modifierCount={modifierCount}
                  modifierSections={modifierSections}
                  isPending={isPending}
                  onSelectProfile={profileId => setSelectedProfileIds(previousValue => ({
                    ...previousValue,
                    [category.profilesFieldName]: profileId,
                  }))}
                  onApply={() => handleApply(category.profilesFieldName, category.activeIdsFieldName)}
                  onWithdraw={() => handleWithdraw(category.profilesFieldName, category.activeIdsFieldName)}
                  isSelectedProfileActive={Boolean(selectedProfile && activeProfileIds.includes(selectedProfile.id))}
                  isSelectedProfileLinkedToCurrentMode={isSelectedProfileLinkedToCurrentMode}
                  linkedEntityName={linkedEntityName}
                  isLinkedCategory={category.profilesFieldName === 'stanceModifierProfiles' || category.profilesFieldName === 'stateModifierProfiles'}
                />
              );
            })
          }
        </div>
      </CardContent>
    </Card>
  );
}

type ModifierCategoryCardProps =
{
  title: string;
  profiles: BuffProfile[];
  activeProfiles: BuffProfile[];
  selectedProfile?: BuffProfile;
  selectedProfileId: string;
  modifierCount: number;
  modifierSections: { title: string; icon: React.ReactNode; modifiers: string[] }[];
  isPending: boolean;
  isSelectedProfileActive: boolean;
  isSelectedProfileLinkedToCurrentMode: boolean;
  linkedEntityName?: string;
  isLinkedCategory: boolean;
  onSelectProfile: (profileId: string) => void;
  onApply: () => void;
  onWithdraw: () => void;
};

function ModifierCategoryCard
(
  {
    title,
    profiles,
    activeProfiles,
    selectedProfile,
    selectedProfileId,
    modifierCount,
    modifierSections,
    isPending,
    isSelectedProfileActive,
    isSelectedProfileLinkedToCurrentMode,
    linkedEntityName,
    isLinkedCategory,
    onSelectProfile,
    onApply,
    onWithdraw,
  }: ModifierCategoryCardProps
)
{
  const applyButtonLabel = isSelectedProfileLinkedToCurrentMode ? displayedText.applyLinkedProfile : displayedText.applyBuff;

  return (
    <div className='rounded-xl border border-border/60 bg-background/30 p-4 shadow-sm min-w-0'>
      <div className='mb-4 flex flex-col gap-3'>
        <div className='flex flex-col gap-2 rounded-md border border-border/50 bg-background/50 p-3'>
          <div className='flex items-center justify-between gap-3'>
            <h3 className='text-lg font-semibold capitalize text-primary'>{title}</h3>
            <Badge variant='outline'>{profiles.length}</Badge>
          </div>
          {
            activeProfiles.length > 0 ? (
              <div className='flex flex-col gap-2 min-w-0'>
                {
                  activeProfiles.map(activeProfile => {
                    const modifiers = collectBuffProfileModifiers(activeProfile);
                    return (
                      <div key={activeProfile.id} className='rounded-md border border-primary/30 bg-primary/5 p-2 min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge className='w-fit'>{activeProfile.name}</Badge>
                          <span className='text-xs text-muted-foreground'>{`${modifiers.length} ${displayedText.effects}`}</span>
                        </div>
                        {
                          modifiers.length > 0 && (
                            <div className='mt-1.5 flex flex-wrap gap-1'>
                              {modifiers.map(modifier => (
                                <Badge key={`${activeProfile.id}-${modifier}`} variant='secondary' className='w-fit font-normal'>{modifier}</Badge>
                              ))}
                            </div>
                          )
                        }
                      </div>
                    );
                  })
                }
              </div>
            ) : <Badge variant='outline' className='w-fit'>{displayedText.noActiveBuff}</Badge>
          }
          <div className='flex flex-wrap gap-2 overflow-x-auto min-w-0'>
            {
              selectedProfile && (
                <Badge variant='outline' className='w-fit'>{`${modifierCount} ${displayedText.effects}`}</Badge>
              )
            }
            {
              selectedProfile && (
                <Badge variant='outline' className='w-fit'>{`${modifierSections.length} ${displayedText.sections}`}</Badge>
              )
            }
            {
              linkedEntityName && (
                <Badge variant={isSelectedProfileLinkedToCurrentMode ? 'default' : 'outline'} className='w-fit'>
                  {isSelectedProfileLinkedToCurrentMode
                    ? `${displayedText.linkedProfileReady}: ${linkedEntityName}`
                    : `${displayedText.linkedProfile}: ${linkedEntityName}`}
                </Badge>
              )
            }
          </div>
        </div>

        {
          profiles.length > 0 ? (
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Select value={selectedProfileId} onValueChange={onSelectProfile}>
                <SelectTrigger className='w-full sm:w-auto min-w-0'>
                  <SelectValue placeholder={displayedText.selectModifierProfile} />
                </SelectTrigger>
                <SelectContent>
                  {
                    profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>

              <Button type='button' onClick={onApply} disabled={isPending || !selectedProfile || isSelectedProfileActive}>
                {applyButtonLabel}
              </Button>

              <Button type='button' variant='outline' onClick={onWithdraw} disabled={isPending || !selectedProfile || !isSelectedProfileActive}>
                {displayedText.withdrawBuff}
              </Button>
            </div>
          ) : (
            <div className='flex flex-col items-start gap-3 rounded-lg border border-dashed border-border/70 bg-background/40 p-4'>
              <p className='text-sm text-muted-foreground'>{displayedText.noModifierProfiles}</p>
            </div>
          )
        }

        {
          isLinkedCategory && selectedProfile?.linkedEntityId && !linkedEntityName && (
            <p className='text-sm text-muted-foreground'>{displayedText.linkedProfileMissing}</p>
          )
        }
      </div>

      {
        profiles.length > 0 && selectedProfile ? (
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger asChild>
              <Button
                variant='ghost'
                className='w-full flex-wrap justify-start gap-2 px-0 hover:bg-transparent whitespace-normal'
              >
                <ChevronDown className='h-4 w-4 transition-transform data-[state=open]:rotate-180' />
                <span className='text-sm font-semibold capitalize break-words'>
                  {displayedText.modifierDetails}
                </span>
                {selectedProfile.description?.trim() && (
                  <span className='ml-auto min-w-0 text-xs text-muted-foreground break-words'>
                    {selectedProfile.description.substring(0, 50)}{selectedProfile.description.length > 50 ? '...' : ''}
                  </span>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className='space-y-4 pt-4'>
              {
                selectedProfile.description?.trim() && (
                  <p className='text-sm italic text-muted-foreground'>{selectedProfile.description}</p>
                )
              }

              {
                modifierSections.length > 0 ? (
                  <div className='grid gap-3'>
                    {
                      modifierSections.map(section => (
                        <div key={section.title} className='rounded-lg border border-border/60 bg-background/60 p-4'>
                          <div className='mb-3 flex items-center justify-between gap-3'>
                            <h4 className='flex items-center gap-1.5 text-sm font-semibold capitalize text-primary'>
                              {section.icon}
                              {section.title}
                            </h4>
                            <Badge variant='outline'>{section.modifiers.length}</Badge>
                          </div>
                          <div className='space-y-2'>
                            {
                              section.modifiers.map(modifier => (
                                <div key={`${section.title}-${modifier}`} className='rounded-md border border-border/40 bg-background px-3 py-2 text-sm break-words'>
                                  {modifier}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>{displayedText.noBuffModifiers}</p>
                )
              }
            </CollapsibleContent>
          </Collapsible>
        ) : null
      }
    </div>
  );
}

/** Flat list of every stat this profile modifies — for the active-buff summary chips. */
function collectBuffProfileModifiers(profile: BuffProfile): string[]
{
  return collectBuffProfileModifierSections(profile).flatMap(section => section.modifiers);
}

// ROADMAP 2.4 — a small icon per stat category makes the modifier list
// scannable at a glance instead of relying on the title text alone.
const iconClassName = 'h-3.5 w-3.5';
const SECTION_ICONS: Record<'characteristics' | 'attributes' | 'health' | 'defense' | 'offense', React.ReactNode> =
{
  characteristics: <Sparkles className={iconClassName} />,
  attributes: <Zap className={iconClassName} />,
  health: <Heart className={iconClassName} />,
  defense: <Shield className={iconClassName} />,
  offense: <Swords className={iconClassName} />,
};

function collectBuffProfileModifierSections(profile: BuffProfile): { title: string; icon: React.ReactNode; modifiers: string[] }[]
{
  return [
    { title: displayedText.characteristics, icon: SECTION_ICONS.characteristics, modifiers: collectStatisticSectionModifiers(profile.characteristics) },
    { title: displayedText.attributes, icon: SECTION_ICONS.attributes, modifiers: collectStatisticSectionModifiers(profile.attributes) },
    { title: displayedText.health, icon: SECTION_ICONS.health, modifiers: collectSimpleModifiers(profile.health) },
    { title: displayedText.defense, icon: SECTION_ICONS.defense, modifiers: collectSimpleModifiers(profile.defense) },
    { title: displayedText.offense, icon: SECTION_ICONS.offense, modifiers: collectOffenseModifiers(profile) },
  ].filter(section => section.modifiers.length > 0);
}

function collectStatisticSectionModifiers(section: Record<string, StatisticBuff>): string[]
{
  return Object.entries(section).flatMap(([sectionName, statistic]) =>
    Object.entries(statistic)
      .filter(([, value]) => value !== 0)
      .map(([fieldName, value]) => `${displayedText[sectionName as keyof typeof displayedText]}: ${displayedText[fieldName as keyof typeof displayedText]} ${formatModifier(value)}`)
  );
}

function collectSimpleModifiers(section: Record<string, number>): string[]
{
  return Object.entries(section)
    .filter(([, value]) => value !== 0)
    .map(([fieldName, value]) => `${displayedText[fieldName as keyof typeof displayedText]}: ${formatModifier(value)}`);
}

function collectOffenseModifiers(profile: BuffProfile): string[]
{
  return [
    ...collectDamageOffenseSectionModifiers(displayedText.leading, profile.offense.leadingWeapon),
    ...collectDamageOffenseSectionModifiers(displayedText.secondary, profile.offense.secondaryWeapon),
    ...collectDamageOffenseSectionModifiers(displayedText.damageBonus, profile.offense.damageBonus),
    ...collectDamageOffenseSectionModifiers(displayedText.bonusDamage, profile.offense.additionalDamageBonus),
  ];
}

function collectDamageOffenseSectionModifiers(label: string, section: DamageOffenseBuff | WeaponOffenseBuff): string[]
{
  return Object.entries(section)
    .filter(([, value]) => value !== 0)
    .map(([fieldName, value]) => `${label}: ${translateOffenseField(fieldName)} ${formatModifier(value)}`);
}

function translateOffenseField(fieldName: string): string
{
  if (fieldName === 'criticalPower')
  {
    return `${displayedText.critical} ${displayedText.power}`;
  }

  if (fieldName === 'criticalRange')
  {
    return `${displayedText.critical} ${displayedText.range}`;
  }

  return displayedText[fieldName as keyof typeof displayedText] ?? fieldName;
}

function formatModifier(value: number): string
{
  return `${value >= 0 ? '+' : ''}${value}`;
}

function createSelectedProfileIdsState(character: Character): Record<ModifierProfilesFieldName, string>
{
  return {
    buffProfiles: character.activeBuffProfileIds[0] ?? character.buffProfiles[0]?.id ?? '',
    stanceModifierProfiles: character.activeStanceModifierProfileIds[0] ?? character.stanceModifierProfiles[0]?.id ?? '',
    stateModifierProfiles: character.activeStateModifierProfileIds[0] ?? character.stateModifierProfiles[0]?.id ?? '',
    otherModifierProfiles: character.activeOtherModifierProfileIds[0] ?? character.otherModifierProfiles[0]?.id ?? '',
  };
}

function createBuffsPayload(character: Character, overrides: Partial<BuffsDto>): BuffsDto
{
  return {
    buffProfiles: character.buffProfiles,
    activeBuffProfileIds: character.activeBuffProfileIds,
    stanceModifierProfiles: character.stanceModifierProfiles,
    activeStanceModifierProfileIds: character.activeStanceModifierProfileIds,
    stateModifierProfiles: character.stateModifierProfiles,
    activeStateModifierProfileIds: character.activeStateModifierProfileIds,
    otherModifierProfiles: character.otherModifierProfiles,
    activeOtherModifierProfileIds: character.activeOtherModifierProfileIds,
    ...overrides,
  };
}

function getModifierProfiles(character: Character, fieldName: ModifierProfilesFieldName): BuffProfile[]
{
  return character[fieldName];
}

function getActiveProfileIds(character: Character, fieldName: ActiveModifierProfileIdsFieldName): string[]
{
  return character[fieldName];
}

function resolveLinkedEntityName(character: Character, fieldName: ModifierProfilesFieldName, linkedEntityId?: string): string | undefined
{
  if (!linkedEntityId)
  {
    return undefined;
  }

  if (fieldName === 'stanceModifierProfiles')
  {
    return character.stances.find(stance => stance.id === linkedEntityId)?.name;
  }

  if (fieldName === 'stateModifierProfiles')
  {
    return character.states.find(state => state.id === linkedEntityId)?.name;
  }

  return undefined;
}

function resolveSelectedLinkedEntityId(fieldName: ModifierProfilesFieldName, selectedStanceId?: string, selectedStateId?: string): string | undefined
{
  if (fieldName === 'stanceModifierProfiles')
  {
    return selectedStanceId;
  }

  if (fieldName === 'stateModifierProfiles')
  {
    return selectedStateId;
  }

  return undefined;
}

function resolveLinkedProfileId(profiles: BuffProfile[], linkedEntityId?: string): string | undefined
{
  if (!linkedEntityId)
  {
    return undefined;
  }

  return profiles.find(profile => profile.linkedEntityId === linkedEntityId)?.id;
}