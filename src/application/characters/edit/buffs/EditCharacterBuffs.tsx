"use client";

import SubmitButton from '@/common/components/form/SubmitButton';
import EditArraySection from '@/common/components/form/EditArraySection';
import { Character } from '@/domain/characters/Character';
import { BuffProfile, createDefaultBuffProfile, createDefaultOtherModifierProfile, createDefaultStateModifierProfile, createDefaultStanceModifierProfile } from '@/domain/characters/buffs/BuffProfile';
import client from '@/infrastructure/clients/charactersClient';
import { BuffsDto, buffsSchema } from '@/persistence/schemas/characters/buffs/buffsSchema';
import { Form } from '@/ui/form';
import { Label } from '@/ui/label';
import { useFieldArray } from 'react-hook-form';
import { useCharacterForm } from '@/application/characters/edit/hooks/useCharacterForm';
import EditBuffProfileCard, { ModifierProfilesFieldName } from '@/application/characters/edit/buffs/EditBuffProfileCard';
import { displayedText } from '@/common/translations';

type ActiveModifierProfileIdsFieldName = 'activeBuffProfileIds' | 'activeStanceModifierProfileIds' | 'activeStateModifierProfileIds' | 'activeOtherModifierProfileIds';

type ModifierCategoryConfig =
{
  title: string;
  profilesFieldName: ModifierProfilesFieldName;
  activeIdsFieldName: ActiveModifierProfileIdsFieldName;
  createDefault: () => BuffProfile;
};

const modifierCategories: ModifierCategoryConfig[] =
[
  {
    title: displayedText.buffProfiles,
    profilesFieldName: 'buffProfiles',
    activeIdsFieldName: 'activeBuffProfileIds',
    createDefault: createDefaultBuffProfile,
  },
  {
    title: displayedText.stances,
    profilesFieldName: 'stanceModifierProfiles',
    activeIdsFieldName: 'activeStanceModifierProfileIds',
    createDefault: createDefaultStanceModifierProfile,
  },
  {
    title: displayedText.states,
    profilesFieldName: 'stateModifierProfiles',
    activeIdsFieldName: 'activeStateModifierProfileIds',
    createDefault: createDefaultStateModifierProfile,
  },
  {
    title: displayedText.otherModifiers,
    profilesFieldName: 'otherModifierProfiles',
    activeIdsFieldName: 'activeOtherModifierProfileIds',
    createDefault: createDefaultOtherModifierProfile,
  },
] as const;

export default function EditCharacterBuffs({ character }: { character: Character })
{
  const { form, handleSubmit, isPending } = useCharacterForm<BuffsDto>
  ({
    characterId: character.id,
    schema: buffsSchema,
    defaultValues:
    {
      buffProfiles: character.buffProfiles,
      activeBuffProfileIds: character.activeBuffProfileIds,
      stanceModifierProfiles: character.stanceModifierProfiles,
      activeStanceModifierProfileIds: character.activeStanceModifierProfileIds,
      stateModifierProfiles: character.stateModifierProfiles,
      activeStateModifierProfileIds: character.activeStateModifierProfileIds,
      otherModifierProfiles: character.otherModifierProfiles,
      activeOtherModifierProfileIds: character.activeOtherModifierProfileIds,
    },
    updateFn: async (id, data) =>
    {
      const activeBuffProfileIds = data.activeBuffProfileIds.filter(profileId => data.buffProfiles.some(profile => profile.id === profileId));
      const activeStanceModifierProfileIds = data.activeStanceModifierProfileIds.filter(profileId => data.stanceModifierProfiles.some(profile => profile.id === profileId));
      const activeStateModifierProfileIds = data.activeStateModifierProfileIds.filter(profileId => data.stateModifierProfiles.some(profile => profile.id === profileId));
      const activeOtherModifierProfileIds = data.activeOtherModifierProfileIds.filter(profileId => data.otherModifierProfiles.some(profile => profile.id === profileId));

      await client.updateBuffs(id, {
        ...data,
        activeBuffProfileIds,
        activeStanceModifierProfileIds,
        activeStateModifierProfileIds,
        activeOtherModifierProfileIds,
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        {
          modifierCategories.map(category => (
            <EditModifierCategorySection
              key={category.title}
              category={category}
              character={character}
              form={form}
              isPending={isPending}
            />
          ))
        }

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
}

function EditModifierCategorySection
(
  {
    category,
    character,
    form,
    isPending,
  }:
  {
    category: ModifierCategoryConfig;
    character: Character;
    form: ReturnType<typeof useCharacterForm<BuffsDto>>['form'];
    isPending: boolean;
  }
)
{
  const watchedProfiles = form.watch(category.profilesFieldName);
  const activeProfileIds = form.watch(category.activeIdsFieldName);
  const fieldArray = useFieldArray({ name: category.profilesFieldName, control: form.control });

  const toggleActiveProfile = (profileId: string) =>
  {
    const nextActiveProfileIds = activeProfileIds.includes(profileId)
      ? activeProfileIds.filter(activeProfileId => activeProfileId !== profileId)
      : [...activeProfileIds, profileId];

    form.setValue(category.activeIdsFieldName, nextActiveProfileIds, { shouldDirty: true });
  };

  const handleRemoveProfile = (index: number, profileId: string) =>
  {
    form.setValue(category.activeIdsFieldName, form.getValues(category.activeIdsFieldName).filter(activeProfileId => activeProfileId !== profileId), { shouldDirty: true });
    fieldArray.remove(index);
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col items-center gap-3'>
        <Label className='text-lg font-semibold capitalize'>{`${displayedText.activeProfiles}: ${category.title}`}</Label>
        <div className='flex max-w-4xl flex-wrap justify-center gap-2'>
          {
            watchedProfiles.length > 0 ? watchedProfiles.map(profile => (
              <button
                key={profile.id}
                type='button'
                className={`rounded-md border px-3 py-2 text-sm ${activeProfileIds.includes(profile.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'}`}
                onClick={() => toggleActiveProfile(profile.id)}
              >
                {profile.name}
              </button>
            )) : <span className='text-sm text-muted-foreground'>{displayedText.none}</span>
          }
        </div>
      </div>

      <EditArraySection<BuffsDto, ModifierProfilesFieldName>
        title={category.title}
        fieldArray={fieldArray}
        createDefault={category.createDefault}
        isPending={isPending}
        renderItem={(buffProfile, index) => (
          <EditBuffProfileCard
            key={buffProfile.id}
            fieldName={category.profilesFieldName}
            buffProfile={{
              ...buffProfile,
              linkedEntityId: buffProfile.linkedEntityId ?? undefined,
            }}
            index={index}
            linkedEntities={resolveLinkedEntities(character, category.profilesFieldName)}
            linkedEntityLabel={resolveLinkedEntityLabel(category.profilesFieldName)}
            isActive={activeProfileIds.includes(buffProfile.id)}
            onToggleActive={() => toggleActiveProfile(buffProfile.id)}
            onRemove={() => handleRemoveProfile(index, buffProfile.id)}
          />
        )}
        gridCols={1}
      />
    </div>
  );
}

function resolveLinkedEntities(character: Character, fieldName: ModifierProfilesFieldName)
{
  if (fieldName === 'stanceModifierProfiles')
  {
    return character.stances;
  }

  if (fieldName === 'stateModifierProfiles')
  {
    return character.states;
  }

  return undefined;
}

function resolveLinkedEntityLabel(fieldName: ModifierProfilesFieldName): string | undefined
{
  if (fieldName === 'stanceModifierProfiles')
  {
    return displayedText.linkedStance;
  }

  if (fieldName === 'stateModifierProfiles')
  {
    return displayedText.linkedState;
  }

  return undefined;
}