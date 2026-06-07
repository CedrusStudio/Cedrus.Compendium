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

type EditBuffProfileCardProps =
{
  index: number;
  buffProfile: BuffProfile;
  onRemove: () => void;
};

const statisticBuffFields = ['value', 'bonus', 'testBonus', 'grade'] as const;

export default function EditBuffProfileCard({ index, buffProfile, onRemove }: EditBuffProfileCardProps)
{
  return (
    <DataCard
      variant='muted'
      className='border shadow-md'
      headerClassName='flex justify-between items-center gap-4'
      contentClassName='space-y-6 -mt-2'
    >
      <div className='flex justify-between items-center gap-4'>
        <InputFormField<BuffsDto> path={toBuffProfilePath(index, 'name')} inputClassName='w-50 sm:w-80 h-10 text-center font-medium' />
        <RemoveFromArrayButton onRemove={onRemove} />
      </div>

      <AreaInputFormField<BuffsDto>
        path={toBuffProfilePath(index, 'description')}
        inputPlaceholder={displayedText.changeDescription}
      />

      <SectionTitle title={displayedText.characteristics} />
      <div className='grid gap-4 lg:grid-cols-2'>
        {
          (Object.keys(buffProfile.characteristics) as (keyof BuffProfile['characteristics'])[])
            .map(statisticName => (
              <StatisticBuffEditor
                key={statisticName}
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
            .map(fieldName => (
              <LabeledBuffInput
                key={fieldName}
                path={toNestedBuffPath(index, `health.${fieldName}`)}
                label={displayedText[fieldName as keyof typeof displayedText]}
              />
            ))
        }
      </div>

      <SectionTitle title={displayedText.defense} />
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {
          (Object.keys(buffProfile.defense) as (keyof BuffProfile['defense'])[])
            .map(fieldName => (
              <LabeledBuffInput
                key={fieldName}
                path={toNestedBuffPath(index, `defense.${fieldName}`)}
                label={displayedText[fieldName as keyof typeof displayedText]}
              />
            ))
        }
      </div>

      <SectionTitle title={displayedText.offense} />
      <div className='grid gap-4 lg:grid-cols-2'>
        <OffenseBuffEditor
          index={index}
          title={displayedText.leading}
          fieldName='leadingWeapon'
          fields={Object.keys(buffProfile.offense.leadingWeapon) as (keyof BuffProfile['offense']['leadingWeapon'])[]}
        />
        <OffenseBuffEditor
          index={index}
          title={displayedText.secondary}
          fieldName='secondaryWeapon'
          fields={Object.keys(buffProfile.offense.secondaryWeapon) as (keyof BuffProfile['offense']['secondaryWeapon'])[]}
        />
        <OffenseBuffEditor
          index={index}
          title={displayedText.damageBonus}
          fieldName='damageBonus'
          fields={Object.keys(buffProfile.offense.damageBonus) as (keyof BuffProfile['offense']['damageBonus'])[]}
        />
        <OffenseBuffEditor
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
    index,
    sectionName,
    statisticName,
  }:
  {
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
          statisticBuffFields.map(fieldName => (
            <LabeledBuffInput
              key={fieldName}
              path={toNestedBuffPath(index, `${sectionName}.${statisticName}.${fieldName}`)}
              label={displayedText[fieldName]}
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
    fieldName,
    fields,
  }:
  {
    index: number;
    title: string;
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
              path={toNestedBuffPath(index, `offense.${fieldName}.${field}`)}
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

function toBuffProfilePath(index: number, fieldName: keyof BuffProfile): FieldPath<BuffsDto>
{
  return `buffProfiles.${index}.${fieldName}` as FieldPath<BuffsDto>;
}

function toNestedBuffPath(index: number, fieldPath: string): FieldPath<BuffsDto>
{
  return `buffProfiles.${index}.${fieldPath}` as FieldPath<BuffsDto>;
}