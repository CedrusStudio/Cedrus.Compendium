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

          <EditWeaponView equipmentFormName={equipmentFormName} weapon={input.character.equipment.weapon1} control={form.control} weaponNumber={1} isPending={isPending} />
          { input.character.equipment.weapon2 && <EditWeaponView equipmentFormName={equipmentFormName} weapon={input.character.equipment.weapon2} control={form.control} weaponNumber={2} isPending={isPending} /> }
          { input.character.equipment.weapon3 && <EditWeaponView equipmentFormName={equipmentFormName} weapon={input.character.equipment.weapon3} control={form.control} weaponNumber={3} isPending={isPending} /> }
          { input.character.equipment.weapon4 && <EditWeaponView equipmentFormName={equipmentFormName} weapon={input.character.equipment.weapon4} control={form.control} weaponNumber={4} isPending={isPending} /> }

          <EditArmorView equipmentFormName={equipmentFormName} armor={input.character.equipment.armor} control={form.control} isPending={isPending} />
          <EditShieldView equipmentFormName={equipmentFormName} shield={input.character.equipment.shield} control={form.control} isPending={isPending} />

          {
            input.character.equipment.magicEquipment.map(item => (
              <AccordionItem key={item.name} value={item.name}>
                <AccordionTrigger>{item.name}</AccordionTrigger>
                <AccordionContent>
                  {item.description}
                </AccordionContent>
              </AccordionItem>
            ))
          }

        </Accordion>      
      </form>
    </Form>
  );
};
