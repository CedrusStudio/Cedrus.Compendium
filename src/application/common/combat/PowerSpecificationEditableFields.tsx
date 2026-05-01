"use client";

import { Label } from "@/ui/label"
import { displayedText } from '@/common/translations';
import { InputFormField } from '@/common/components/form/InputFormField';
import { CreateDefaultPowerOffense, PowerSpecification } from "@/domain/characters/combat/Power";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { useFormContext, useFieldArray } from "react-hook-form";
import { PowerSpecificationDto } from "@/persistence/schemas/characters/combat/powerSchema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { useState, useEffect } from "react";
import AppendToArrayButton from "@/common/components/form/AppendToArrayButton";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { usePowerOffenseForm } from "@/application/common/combat/usePowerOffenseForm";
import { Card, CardContent } from "@/common/components/ui/card";
import EditWeaponDamageView from '@/application/characters/edit/combat/offense/EditWeaponDamageView';
import EditDamageBonusView from '@/application/characters/edit/combat/offense/EditDamageBonusView';
import EditCriticalView from '@/application/characters/edit/combat/offense/EditCriticalView';

export default function PowerSpecificationEditableFields()
{
  return (
    <>
      <div className="flex justify-around">
        <div className="grid auto-rows-min gap-3 px-4">
          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.name}</span></Label>
          <InputFormField<PowerSpecification> 
            path={'name'}  
            inputPlaceholder={displayedText.changeName} 
            inputClassName='w-60' 
          />
        </div>
      </div>

      <div className="grid auto-rows-min gap-3 px-4">
        <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.description}</span></Label>
        <AreaInputFormField<PowerSpecification> 
          path={'description'} 
          inputPlaceholder={displayedText.changeDescription} 
          inputClassName='w-80' 
        />
      </div>

      <FormTagsInput<PowerSpecification> path={'tags'} entityType="powerSpecifications" />
      <PowerOffenseArrayEditor />
    </>
  );
};

function PowerOffenseArrayEditor()
{
  const { control } = useFormContext<PowerSpecificationDto>();
  const { fields, append, remove } = useFieldArray
  ({
    name: "offenses",
    control
  });

  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState(0);

  // Ensure selected index is valid when array changes
  useEffect(() => 
  {
    if (fields.length === 0) 
    {
      setSelectedOffenseIndex(0);
      return;
    } 

    if (selectedOffenseIndex >= fields.length) 
    {
      setSelectedOffenseIndex(fields.length - 1);
    }
  }, [fields.length, selectedOffenseIndex]);

  if (fields.length === 0) 
  {
    return (
      <Card className="flex items-center justify-center bg-secondary p-4">
        <CardContent className='flex flex-col gap-2 items-center justify-center'>
          <Label className='text-center'>Dodaj siłę zaklęcia:</Label>
          <AppendToArrayButton<PowerSpecificationDto, "offenses">
            append={append}
            toAdd={CreateDefaultPowerOffense}
            isPending={false}
          />
        </CardContent>
      </Card>
    );
  }

  const selectedOffense = fields[selectedOffenseIndex];

  return (
    <div className="grid auto-rows-min gap-4 px-4">
      <div className="flex items-center gap-3 justify-center">
        <Select 
          value={String(selectedOffenseIndex)} 
          onValueChange={val => setSelectedOffenseIndex(Number(val))}
        >
          <SelectTrigger className="w-60">
            <SelectValue />
          </SelectTrigger>
          
          <SelectContent>
          {
            fields.map((field, index) => (
              <SelectItem key={field.id} value={String(index)}>Siła zaklęcia {index}</SelectItem>
            ))
          }
          </SelectContent>
        </Select>

        <AppendToArrayButton<PowerSpecificationDto, "offenses">
          append={append}
          toAdd={CreateDefaultPowerOffense}
          isPending={false}
        />

        {
          fields.length > 0 && (
            <RemoveFromArrayButton 
              remove={remove} 
              index={selectedOffenseIndex} 
            />
          )
        }
      </div>

      {
        selectedOffense && (
          <PowerOffenseEditor 
            key={selectedOffense.id}
            offenseIndex={selectedOffenseIndex} 
            defaultOffense={selectedOffense}
          />
        )
      }
    </div>
  );
}

type PowerOffenseEditorProps = 
{
  offenseIndex: number;
  defaultOffense: PowerSpecificationDto['offenses'][number];
};

function PowerOffenseEditor({ offenseIndex, defaultOffense }: PowerOffenseEditorProps)
{
  const { control } = useFormContext<PowerSpecificationDto>();
  const { spellOffense, spellDamage } = usePowerOffenseForm(control, offenseIndex, defaultOffense);

  const spellOffenseValue = 
  {
    amount: spellOffense.amount,
    grade: spellOffense.grade,
    bonus: spellOffense.bonus,
    isPhantom: spellOffense.isPhantom,
    critical: { power: spellOffense.power, range: spellOffense.range }
  };

  const spellDamageValue = 
  {
    amount: spellDamage.amount,
    grade: spellDamage.grade,
    bonus: spellDamage.bonus,
    isPhantom: spellDamage.isPhantom
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-md bg-muted/30">
      
      <div className="flex flex-col place-items-center gap-3">

        <Label className="text-center font-semibold">Kości zaklęć</Label>

        <div className="flex flex-col gap-2 items-center">
          <EditWeaponDamageView 
            weaponOffense={spellOffenseValue}
            setAmount={spellOffense.setAmount}
            setGrade={spellOffense.setGrade}
            setBonus={spellOffense.setBonus}
            setIsPhantom={spellOffense.setIsPhantom}
          />
          <EditCriticalView 
            weaponOffense={spellOffenseValue}
            setPower={spellOffense.setPower}
            setRange={spellOffense.setRange}
          />
        </div>
      </div>

      <div className="flex flex-col place-items-center gap-3">

        <Label className="text-center font-semibold">Bonus obrażeń</Label>
        <div className="flex items-center justify-center">
          <EditDamageBonusView 
            damageOffense={spellDamageValue}
            setAmount={spellDamage.setAmount}
            setGrade={spellDamage.setGrade}
            setBonus={spellDamage.setBonus}
            setIsPhantom={spellDamage.setIsPhantom}
          />
        </div>

      </div>

      <div className="col-span-full flex flex-col gap-2 place-items-center">
        <Label>Opis</Label>
        <AreaInputFormField<PowerSpecificationDto>
          path={`offenses.${offenseIndex}.description`}
          inputPlaceholder="Wpisz opisowy efekt mocy..."
          inputClassName="w-full min-w-60"
        />
      </div>

      <div className="col-span-full flex flex-col gap-2 place-items-center">
        <Label>Koszt</Label>
        <InputFormField<PowerSpecificationDto>
          path={`offenses.${offenseIndex}.cost`}
          inputPlaceholder="Koszt"
        />
      </div>
    </div>
  );
}