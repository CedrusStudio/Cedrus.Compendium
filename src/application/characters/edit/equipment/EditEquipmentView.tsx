"use client";

import { Character } from '@/domain/characters/Character';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion"
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from 'react-hook-form';
import { upsertCharacterEquipmentSchema, type UpsertCharacterEquipmentType } from '@/persistence/characterSchemas';
import { useFormMutation } from '@/infrastructure/hooks/useFormMutation';
import EditShieldView from '@/application/characters/edit/equipment/EditShieldView';
import EditWeaponView from '@/application/characters/edit/equipment/EditWeaponView';
import EditArmorView from '@/application/characters/edit/equipment/EditArmorView';
import bffClient from '@/infrastructure/bffClient';
import EditHorseView from './EditHorseView';

const equipmentFormName = "edit-equipment-form";

export default function EditEquipmentView(input: { character: Character })
{
  const initialValues: UpsertCharacterEquipmentType = input.character.equipment;
  const form = useForm<UpsertCharacterEquipmentType>
  ({
      resolver: zodResolver(upsertCharacterEquipmentSchema),
      defaultValues: initialValues,
  })

  const id = input.character.id;

  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterEquipment: UpsertCharacterEquipmentType) => await bffClient.upsertCharacter(id, { ...input.character, equipment: characterEquipment }),
    {
      invalidateOnSuccess: ['characters', `characters/${id}`, `characters/${id}/edit`],
      toastPosition: "bottom-left",
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} id={equipmentFormName} className="space-y-8">

        <Accordion type="single" collapsible>

          {
            input.character.equipment.weapons.map((weapon, index) => (
              <EditWeaponView key={index} index={index} equipmentFormName={equipmentFormName} weapon={weapon} isPending={isPending} />
            ))
          }

          {
            input.character.equipment.armors.map((armor, index) => (
              <EditArmorView key={index} index={index} equipmentFormName={equipmentFormName} armor={armor} isPending={isPending} />
            ))
          }

          {
            input.character.equipment.shields.map((shield, index) => (
              <EditShieldView key={index} index={index} equipmentFormName={equipmentFormName} shield={shield} isPending={isPending} />
            ))
          }

          {
            input.character.equipment.inventory.map(item => (
              <AccordionItem key={item.name} value={item.name}>
                <AccordionTrigger>{item.name}</AccordionTrigger>
                <AccordionContent>
                  {item.description}
                </AccordionContent>
              </AccordionItem>
            ))
          }

          {
            input.character.equipment.horses.map((horse, index) => (
              <EditHorseView key={index} index={index} equipmentFormName={equipmentFormName} horse={horse} isPending={isPending} />
            ))
          }

        </Accordion>      
      </form>
    </Form>
  );
};
