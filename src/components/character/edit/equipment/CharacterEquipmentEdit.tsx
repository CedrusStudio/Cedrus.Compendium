"use client";

import { Character } from '@/domain/Character';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Form,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from 'react-hook-form';
import { upsertCharacterEquipmentSchema, type UpsertCharacterEquipmentType } from '@/persistence/characterSchemas';
import { upsertCharacterEquipment } from '@/persistence/characterRepository';
import AccordionShieldItem from '@/components/character/edit/equipment/AccordionShieldItem';
import AccordionWeaponItem from '@/components/character/edit/equipment/AccordionWeaponItem';
import AccordionArmorItem from '@/components/character/edit/equipment/AccordionArmorItem';
import { useCallback, useEffect } from 'react';
import { useFormMutation } from '@/hooks/useFormMutation';

const equipmentFormName = "edit-equipment-form";

export default function CharacterEquipmentEdit(input: { character: Character })
{
    const initialValues: UpsertCharacterEquipmentType = input.character.equipment;
    const form = useForm<UpsertCharacterEquipmentType>
    ({
        resolver: zodResolver(upsertCharacterEquipmentSchema),
        defaultValues: initialValues,
    })

    const id = input.character.id;
    
    useEffect(() => 
    {
      form.reset(initialValues);
    }, [initialValues, form]);

    const mutationFn = useCallback
    (
      async (characterEquipment: UpsertCharacterEquipmentType) => await upsertCharacterEquipment(id, characterEquipment),
      [id]
    );

    const { handleSubmit, isPending } = useFormMutation(mutationFn, 
    {
      form,
      initialValues,
      invalidateOnSuccess: ['characters', `characters/${id}`, `characters/${id}/edit`],
      toastPosition: "bottom-left",
    });

  return (
    <Form {...form}>

        <form onSubmit={form.handleSubmit(handleSubmit)} id={equipmentFormName} className="space-y-8">

          <Accordion type="single" collapsible>

            <AccordionWeaponItem equipmentFormName={equipmentFormName} weapon={input.character.equipment.weapon1} control={form.control} weaponNumber={1} isPending={isPending} />
            { input.character.equipment.weapon2 && <AccordionWeaponItem equipmentFormName={equipmentFormName} weapon={input.character.equipment.weapon2} control={form.control} weaponNumber={2} isPending={isPending} /> }
            { input.character.equipment.weapon3 && <AccordionWeaponItem equipmentFormName={equipmentFormName} weapon={input.character.equipment.weapon3} control={form.control} weaponNumber={3} isPending={isPending} /> }
            { input.character.equipment.weapon4 && <AccordionWeaponItem equipmentFormName={equipmentFormName} weapon={input.character.equipment.weapon4} control={form.control} weaponNumber={4} isPending={isPending} /> }

            <AccordionArmorItem equipmentFormName={equipmentFormName} armor={input.character.equipment.armor} control={form.control} isPending={isPending} />
            <AccordionShieldItem equipmentFormName={equipmentFormName} shield={input.character.equipment.shield} control={form.control} isPending={isPending} />

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
