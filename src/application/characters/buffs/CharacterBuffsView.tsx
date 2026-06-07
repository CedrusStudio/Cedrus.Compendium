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

export default function CharacterBuffsView({ character }: CharacterBuffsViewProps)
{
  const [selectedBuffProfileId, setSelectedBuffProfileId] = useState<string>(character.activeBuffProfileId ?? character.buffProfiles[0]?.id ?? '');

  useEffect(() =>
  {
    setSelectedBuffProfileId(character.activeBuffProfileId ?? character.buffProfiles[0]?.id ?? '');
  }, [character.activeBuffProfileId, character.buffProfiles]);

  const selectedBuffProfile = character.buffProfiles.find(profile => profile.id === selectedBuffProfileId) ?? character.buffProfiles[0];
  const activeBuffProfile = character.buffProfiles.find(profile => profile.id === character.activeBuffProfileId);
  const modifiers = useMemo(() => selectedBuffProfile ? collectBuffProfileModifiers(selectedBuffProfile) : [], [selectedBuffProfile]);

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
            {
              activeBuffProfile ? (
                <Badge className='w-fit'>{`${displayedText.activeBuff}: ${activeBuffProfile.name}`}</Badge>
              ) : (
                <Badge variant='outline' className='w-fit'>{displayedText.noActiveBuff}</Badge>
              )
            }
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
            <p className='text-sm text-muted-foreground'>{displayedText.noBuffProfiles}</p>
          ) : selectedBuffProfile ? (
            <div className='space-y-3'>
              {
                selectedBuffProfile.description?.trim() && (
                  <p className='text-sm italic text-muted-foreground'>{selectedBuffProfile.description}</p>
                )
              }

              {
                modifiers.length > 0 ? (
                  <div className='grid gap-2 lg:grid-cols-2'>
                    {
                      modifiers.map(modifier => (
                        <div key={modifier} className='rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm'>
                          {modifier}
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

function collectBuffProfileModifiers(profile: BuffProfile): string[]
{
  return [
    ...collectStatisticSectionModifiers(profile.characteristics),
    ...collectStatisticSectionModifiers(profile.attributes),
    ...collectSimpleModifiers(profile.health),
    ...collectSimpleModifiers(profile.defense),
    ...collectOffenseModifiers(profile),
  ];
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