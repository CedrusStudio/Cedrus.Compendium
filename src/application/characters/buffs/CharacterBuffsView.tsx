"use client";

import { createCharacterCacheKeys } from '@/application/characters/edit/editFormConstants';
import { Character } from '@/domain/characters/Character';
import { BuffProfile, DamageOffenseBuff, StatisticBuff, WeaponOffenseBuff } from '@/domain/characters/buffs/BuffProfile';
import Link from 'next/link';
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

export default function CharacterBuffsView({ character }: CharacterBuffsViewProps)
{
  const [selectedBuffProfileId, setSelectedBuffProfileId] = useState<string>(character.activeBuffProfileId ?? character.buffProfiles[0]?.id ?? '');

  useEffect(() =>
  {
    setSelectedBuffProfileId(character.activeBuffProfileId ?? character.buffProfiles[0]?.id ?? '');
  }, [character.activeBuffProfileId, character.buffProfiles]);

  const selectedBuffProfile = character.buffProfiles.find(profile => profile.id === selectedBuffProfileId) ?? character.buffProfiles[0];
  const activeBuffProfile = character.buffProfiles.find(profile => profile.id === character.activeBuffProfileId);
  const modifierSections = useMemo(() => selectedBuffProfile ? collectBuffProfileModifierSections(selectedBuffProfile) : [], [selectedBuffProfile]);
  const modifierCount = modifierSections.reduce((total, section) => total + section.modifiers.length, 0);

  const { handleSubmit, isPending } = useFormMutation<BuffsDto>
  (
    async (data) => await client.updateBuffs(character.id, data),
    {
      invalidateOnSuccess: createCharacterCacheKeys(character.id),
      toastPosition: 'bottom-left',
    }
  );

  const handleApply = () =>
  {
    if (!selectedBuffProfileId)
    {
      return;
    }

    handleSubmit({
      buffProfiles: character.buffProfiles,
      activeBuffProfileId: selectedBuffProfileId,
    });
  };

  const handleWithdraw = () =>
  {
    handleSubmit({
      buffProfiles: character.buffProfiles,
      activeBuffProfileId: null,
    });
  };

  return (
    <Card className='bg-muted w-full'>
      <CardHeader className='gap-3'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-col gap-2'>
            <CardTitle className='text-2xl font-bold capitalize'>{displayedText.buffs}</CardTitle>
            <div className='flex flex-wrap gap-2'>
              {
                activeBuffProfile ? (
                  <Badge className='w-fit'>{`${displayedText.activeBuff}: ${activeBuffProfile.name}`}</Badge>
                ) : (
                  <Badge variant='outline' className='w-fit'>{displayedText.noActiveBuff}</Badge>
                )
              }
              {
                selectedBuffProfile && (
                  <Badge variant='secondary' className='w-fit'>{`${displayedText.selected}: ${selectedBuffProfile.name}`}</Badge>
                )
              }
              {
                selectedBuffProfile && (
                  <Badge variant='outline' className='w-fit'>{`${modifierCount} ${displayedText.effects}`}</Badge>
                )
              }
              {
                selectedBuffProfile && (
                  <Badge variant='outline' className='w-fit'>{`${modifierSections.length} ${displayedText.sections}`}</Badge>
                )
              }
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <Select value={selectedBuffProfileId} onValueChange={setSelectedBuffProfileId}>
              <SelectTrigger className='min-w-60'>
                <SelectValue placeholder={displayedText.selectBuffProfile} />
              </SelectTrigger>
              <SelectContent>
                {
                  character.buffProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>

            <Button asChild type='button' variant='secondary'>
              <Link href={`/characters/${character.id}/edit?tab=buffs`}>{displayedText.edit}</Link>
            </Button>

            <Button type='button' onClick={handleApply} disabled={isPending || !selectedBuffProfile || selectedBuffProfile.id === character.activeBuffProfileId}>
              {displayedText.applyBuff}
            </Button>

            <Button type='button' variant='outline' onClick={handleWithdraw} disabled={isPending || !character.activeBuffProfileId}>
              {displayedText.withdrawBuff}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {
          character.buffProfiles.length === 0 ? (
            <div className='flex flex-col items-start gap-3 rounded-lg border border-dashed border-border/70 bg-background/40 p-4'>
              <p className='text-sm text-muted-foreground'>{displayedText.noBuffProfiles}</p>
              <Button asChild type='button' variant='outline'>
                <Link href={`/characters/${character.id}/edit?tab=buffs`}>{displayedText.edit}</Link>
              </Button>
            </div>
          ) : selectedBuffProfile ? (
            <div className='space-y-4'>
              {
                selectedBuffProfile.description?.trim() && (
                  <p className='text-sm italic text-muted-foreground'>{selectedBuffProfile.description}</p>
                )
              }

              {
                modifierSections.length > 0 ? (
                  <div className='grid gap-3 lg:grid-cols-2'>
                    {
                      modifierSections.map(section => (
                        <div key={section.title} className='rounded-lg border border-border/60 bg-background/60 p-4'>
                          <div className='mb-3 flex items-center justify-between gap-3'>
                            <h3 className='text-sm font-semibold capitalize text-primary'>{section.title}</h3>
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
      </CardContent>
    </Card>
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