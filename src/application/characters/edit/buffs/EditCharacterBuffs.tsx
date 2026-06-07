"use client";

import SubmitButton from '@/common/components/form/SubmitButton';
import EditArraySection from '@/common/components/form/EditArraySection';
import { Character } from '@/domain/characters/Character';
import { createDefaultBuffProfile } from '@/domain/characters/buffs/BuffProfile';
import client from '@/infrastructure/clients/charactersClient';
import { BuffsDto, buffsSchema } from '@/persistence/schemas/characters/buffs/buffsSchema';
import { Form } from '@/ui/form';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { useFieldArray } from 'react-hook-form';
import { useCharacterForm } from '@/application/characters/edit/hooks/useCharacterForm';
import EditBuffProfileCard from '@/application/characters/edit/buffs/EditBuffProfileCard';
import { displayedText } from '@/common/translations';

const NONE_SELECTED_VALUE = '__none__';

export default function EditCharacterBuffs({ character }: { character: Character })
{
  const { form, handleSubmit, isPending } = useCharacterForm<BuffsDto>
  ({
    characterId: character.id,
    schema: buffsSchema,
    defaultValues:
    {
      buffProfiles: character.buffProfiles,
      activeBuffProfileId: character.activeBuffProfileId,
    },
    updateFn: async (id, data) =>
    {
      const activeBuffProfileId = data.activeBuffProfileId && data.buffProfiles.some(profile => profile.id === data.activeBuffProfileId)
        ? data.activeBuffProfileId
        : null;

      await client.updateBuffs(id, {
        ...data,
        activeBuffProfileId,
      });
    },
  });

  const watchedBuffProfiles = form.watch('buffProfiles');
  const activeBuffProfileId = form.watch('activeBuffProfileId');

  const handleRemoveBuffProfile = (index: number, profileId: string, remove: (index: number) => void) =>
  {
    if (form.getValues('activeBuffProfileId') === profileId)
    {
      form.setValue('activeBuffProfileId', null, { shouldDirty: true });
    }

    remove(index);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        <div className='flex flex-col items-center gap-3'>
          <Label className='text-lg font-semibold capitalize'>{displayedText.activeBuff}</Label>

          <Select
            value={activeBuffProfileId ?? NONE_SELECTED_VALUE}
            onValueChange={value => form.setValue('activeBuffProfileId', value === NONE_SELECTED_VALUE ? null : value, { shouldDirty: true })}
          >
            <SelectTrigger className='w-full max-w-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_SELECTED_VALUE}>{displayedText.none}</SelectItem>
              {
                watchedBuffProfiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>

        <EditArraySection<BuffsDto, 'buffProfiles'>
          title={displayedText.buffProfiles}
          fieldArray={useFieldArray({ name: 'buffProfiles', control: form.control })}
          createDefault={createDefaultBuffProfile}
          isPending={isPending}
          renderItem={(buffProfile, index, remove) => (
            <EditBuffProfileCard
              key={buffProfile.id}
              buffProfile={buffProfile}
              index={index}
              onRemove={() => handleRemoveBuffProfile(index, buffProfile.id, remove)}
            />
          )}
          gridCols={1}
        />

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
}