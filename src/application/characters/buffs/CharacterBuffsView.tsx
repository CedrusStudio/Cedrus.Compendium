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
import { useEffect, useMemo, useState } from 'react';

type CharacterBuffsViewProps =
{
  character: Character;
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

export default function CharacterBuffsView({ character }: CharacterBuffsViewProps)
{
  const [selectedProfileIds, setSelectedProfileIds] = useState<Record<ModifierProfilesFieldName, string>>(() => createSelectedProfileIdsState(character));

  useEffect(() =>
  {
    setSelectedProfileIds(createSelectedProfileIdsState(character));
  }, [character]);

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
    <Card className='bg-muted w-full'>
      <CardHeader className='gap-3'>
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
        <div className='grid gap-4 xl:grid-cols-2'>
          {
            modifierCategories.map(category => {
              const profiles = getModifierProfiles(character, category.profilesFieldName);
              const activeProfileIds = getActiveProfileIds(character, category.activeIdsFieldName);
              const selectedProfileId = selectedProfileIds[category.profilesFieldName];
              const selectedProfile = profiles.find(profile => profile.id === selectedProfileId) ?? profiles[0];
              const activeProfiles = profiles.filter(profile => activeProfileIds.includes(profile.id));
              const modifierSections = selectedProfile ? collectBuffProfileModifierSections(selectedProfile) : [];
              const modifierCount = modifierSections.reduce((total, section) => total + section.modifiers.length, 0);

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
  modifierSections: { title: string; modifiers: string[] }[];
  isPending: boolean;
  isSelectedProfileActive: boolean;
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
    onSelectProfile,
    onApply,
    onWithdraw,
  }: ModifierCategoryCardProps
)
{
  return (
    <div className='rounded-lg border border-border/60 bg-background/30 p-4'>
      <div className='mb-4 flex flex-col gap-3'>
        <div className='flex flex-col gap-2'>
          <h3 className='text-lg font-semibold capitalize text-primary'>{title}</h3>
          <div className='flex flex-wrap gap-2'>
            {
              activeProfiles.length > 0 ? activeProfiles.map(activeProfile => (
                <Badge key={activeProfile.id} className='w-fit'>{activeProfile.name}</Badge>
              )) : <Badge variant='outline' className='w-fit'>{displayedText.noActiveBuff}</Badge>
            }
            {
              selectedProfile && (
                <Badge variant='secondary' className='w-fit'>{`${displayedText.selected}: ${selectedProfile.name}`}</Badge>
              )
            }
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
          </div>
        </div>

        {
          profiles.length > 0 ? (
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Select value={selectedProfileId} onValueChange={onSelectProfile}>
                <SelectTrigger className='min-w-60'>
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
                    )) : <Badge variant='outline' className='w-fit'>{displayedText.noActiveProfiles}</Badge>
              <Button type='button' onClick={onApply} disabled={isPending || !selectedProfile || isSelectedProfileActive}>
                {displayedText.applyBuff}
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
      </div>

      {
        profiles.length > 0 && selectedProfile ? (
          <div className='space-y-4'>
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
                          <h4 className='text-sm font-semibold capitalize text-primary'>{section.title}</h4>
                          <Badge variant='outline'>{section.modifiers.length}</Badge>
                        </div>
                        <div className='space-y-2'>
                          {
                            section.modifiers.map(modifier => (
                              <div key={`${section.title}-${modifier}`} className='rounded-md border border-border/40 bg-background px-3 py-2 text-sm'>
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
          </div>
        ) : null
      }
    </div>
  );
}

function collectBuffProfileModifierSections(profile: BuffProfile): { title: string; modifiers: string[] }[]
{
  return [
    { title: displayedText.characteristics, modifiers: collectStatisticSectionModifiers(profile.characteristics) },
    { title: displayedText.attributes, modifiers: collectStatisticSectionModifiers(profile.attributes) },
    { title: displayedText.health, modifiers: collectSimpleModifiers(profile.health) },
    { title: displayedText.defense, modifiers: collectSimpleModifiers(profile.defense) },
    { title: displayedText.offense, modifiers: collectOffenseModifiers(profile) },
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