"use client";

import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import { InputFormField } from '@/common/components/form/InputFormField';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { DataCard } from '@/common/components/cards/DataCard';
import { BuffProfile } from '@/domain/characters/buffs/BuffProfile';
import { displayedText } from '@/common/translations';
import { Label } from '@/ui/label';
import { FieldPath } from 'react-hook-form';
import { BuffsDto } from '@/persistence/schemas/characters/buffs/buffsSchema';
import { FormControl, FormField, FormItem, FormLabel } from '@/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { useFormContext } from 'react-hook-form';

export type ModifierProfilesFieldName = 'buffProfiles' | 'stanceModifierProfiles' | 'stateModifierProfiles' | 'otherModifierProfiles';

type LinkedEntityOption =
{
  id: string;
  name: string;
  grade?: number;
};

type EditBuffProfileCardProps =
{
  fieldName: ModifierProfilesFieldName;
  index: number;
  buffProfile: BuffProfile;
  linkedEntities?: LinkedEntityOption[];
  linkedEntityLabel?: string;
  isActive: boolean;
  onToggleActive: () => void;
  onRemove: () => void;
};

const statisticBuffFields = ['value', 'bonus', 'testBonus', 'grade'] as const;
const NO_LINKED_ENTITY = '__none__';

export default function EditBuffProfileCard({ fieldName, index, buffProfile, linkedEntities, linkedEntityLabel, isActive, onToggleActive, onRemove }: EditBuffProfileCardProps)
{
  const { control } = useFormContext<BuffsDto>();

  return (
    <DataCard
      variant='muted'
      className='border shadow-md'
      headerClassName='flex justify-between items-center gap-4'
      contentClassName='space-y-6 -mt-2'
    >
      <div className='flex justify-between items-center gap-4'>
        <InputFormField<BuffsDto> path={toBuffProfilePath(fieldName, index, 'name')} inputClassName='w-50 sm:w-80 h-10 text-center font-medium' />
        <div className='flex items-center gap-2'>
          <button
            type='button'
            className={`rounded-md border px-3 py-2 text-sm ${isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'}`}
            onClick={onToggleActive}
          >
            {isActive ? displayedText.withdrawBuff : displayedText.applyBuff}
          </button>
          <RemoveFromArrayButton onRemove={onRemove} />
        </div>
      </div>

      <AreaInputFormField<BuffsDto>
        path={toBuffProfilePath(fieldName, index, 'description')}
        inputPlaceholder={displayedText.changeDescription}
      />

      {
        linkedEntities && linkedEntities.length > 0 && (
          <FormField
            control={control}
            name={toBuffProfilePath(fieldName, index, 'linkedEntityId')}
            render={({ field }) => (
              <FormItem>
                <FormLabel className='capitalize'>{linkedEntityLabel}</FormLabel>
                <Select value={typeof field.value === 'string' ? field.value : NO_LINKED_ENTITY} onValueChange={value => field.onChange(value === NO_LINKED_ENTITY ? null : value)}>
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={displayedText.selectLinkedEntity} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_LINKED_ENTITY}>{displayedText.none}</SelectItem>
                    {
                      linkedEntities.map(entity => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.grade !== undefined ? `${entity.name} (${entity.grade})` : entity.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )
      }

      <SectionTitle title={displayedText.characteristics} />
      <div className='grid gap-4 lg:grid-cols-2'>
        {
          (Object.keys(buffProfile.characteristics) as (keyof BuffProfile['characteristics'])[])
            .map(statisticName => (
              <StatisticBuffEditor
                key={statisticName}
                fieldName={fieldName}
                index={index}
                sectionName='characteristics'
                statisticName={statisticName}
              />
            ))
        }
      </div>

      <SectionTitle title={displayedText.attributes} />
      <div className='grid gap-4 lg:grid-cols-2'>
        {
          (Object.keys(buffProfile.attributes) as (keyof BuffProfile['attributes'])[])
            .map(statisticName => (
              <StatisticBuffEditor
                key={statisticName}
                fieldName={fieldName}
                index={index}
                sectionName='attributes'
                statisticName={statisticName}
              />
            ))
        }
      </div>

      <SectionTitle title={displayedText.health} />
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {
          (Object.keys(buffProfile.health) as (keyof BuffProfile['health'])[])
            .map(healthFieldName => (
              <LabeledBuffInput
                key={healthFieldName}
                path={toNestedBuffPath(fieldName, index, `health.${healthFieldName}`)}
                label={displayedText[healthFieldName as keyof typeof displayedText]}
              />
            ))
        }
      </div>

      <SectionTitle title={displayedText.defense} />
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {
          (Object.keys(buffProfile.defense) as (keyof BuffProfile['defense'])[])
            .map(defenseFieldName => (
              <LabeledBuffInput
                key={defenseFieldName}
                path={toNestedBuffPath(fieldName, index, `defense.${defenseFieldName}`)}
                label={displayedText[defenseFieldName as keyof typeof displayedText]}
              />
            ))
        }
      </div>

      <SectionTitle title={displayedText.offense} />
      <div className='grid gap-4 lg:grid-cols-2'>
        <OffenseBuffEditor
          fieldNamePrefix={fieldName}
          index={index}
          title={displayedText.leading}
          fieldName='leadingWeapon'
          fields={Object.keys(buffProfile.offense.leadingWeapon) as (keyof BuffProfile['offense']['leadingWeapon'])[]}
        />
        <OffenseBuffEditor
          fieldNamePrefix={fieldName}
          index={index}
          title={displayedText.secondary}
          fieldName='secondaryWeapon'
          fields={Object.keys(buffProfile.offense.secondaryWeapon) as (keyof BuffProfile['offense']['secondaryWeapon'])[]}
        />
        <OffenseBuffEditor
          fieldNamePrefix={fieldName}
          index={index}
          title={displayedText.damageBonus}
          fieldName='damageBonus'
          fields={Object.keys(buffProfile.offense.damageBonus) as (keyof BuffProfile['offense']['damageBonus'])[]}
        />
        <OffenseBuffEditor
          fieldNamePrefix={fieldName}
          index={index}
          title={displayedText.bonusDamage}
          fieldName='additionalDamageBonus'
          fields={Object.keys(buffProfile.offense.additionalDamageBonus) as (keyof BuffProfile['offense']['additionalDamageBonus'])[]}
        />
      </div>
    </DataCard>
  );
}

function StatisticBuffEditor
(
  {
    fieldName,
    index,
    sectionName,
    statisticName,
  }:
  {
    fieldName: ModifierProfilesFieldName;
    index: number;
    sectionName: 'characteristics' | 'attributes';
    statisticName: string;
  }
)
{
  return (
    <div className='rounded-md border border-border/60 bg-background/40 p-4'>
      <Label className='text-base font-semibold capitalize'>{displayedText[statisticName as keyof typeof displayedText]}</Label>
      <div className='mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {
          statisticBuffFields.map(statisticFieldName => (
            <LabeledBuffInput
              key={statisticFieldName}
              path={toNestedBuffPath(fieldName, index, `${sectionName}.${statisticName}.${statisticFieldName}`)}
              label={displayedText[statisticFieldName]}
            />
          ))
        }
      </div>
    </div>
  );
}

function OffenseBuffEditor
(
  {
    index,
    title,
    fieldNamePrefix,
    fieldName,
    fields,
  }:
  {
    index: number;
    title: string;
    fieldNamePrefix: ModifierProfilesFieldName;
    fieldName: keyof BuffProfile['offense'];
    fields: string[];
  }
)
{
  return (
    <div className='rounded-md border border-border/60 bg-background/40 p-4'>
      <Label className='text-base font-semibold capitalize'>{title}</Label>
      <div className='mt-3 grid grid-cols-2 gap-4 lg:grid-cols-3'>
        {
          fields.map(field => (
            <LabeledBuffInput
              key={field}
              path={toNestedBuffPath(fieldNamePrefix, index, `offense.${fieldName}.${field}`)}
              label={translateOffenseField(field)}
            />
          ))
        }
      </div>
    </div>
  );
}

function LabeledBuffInput({ path, label }: { path: FieldPath<BuffsDto>; label: string })
{
  return (
    <div className='flex flex-col items-center gap-2'>
      <Label className='text-center capitalize'>{label}</Label>
      <InputFormField<BuffsDto> path={path} inputClassName='w-18 h-10 text-center font-medium' />
    </div>
  );
}

function SectionTitle({ title }: { title: string })
{
  return <h3 className='text-lg font-semibold text-primary capitalize'>{title}</h3>;
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

function toBuffProfilePath(profileFieldName: ModifierProfilesFieldName, index: number, fieldName: keyof BuffProfile): FieldPath<BuffsDto>
{
  return `${profileFieldName}.${index}.${fieldName}` as FieldPath<BuffsDto>;
}

function toNestedBuffPath(profileFieldName: ModifierProfilesFieldName, index: number, fieldPath: string): FieldPath<BuffsDto>
{
  return `${profileFieldName}.${index}.${fieldPath}` as FieldPath<BuffsDto>;
}