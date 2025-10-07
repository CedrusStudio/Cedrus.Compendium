"use client";

import { Character, Weapon } from '@/domain/characters/Character';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion"
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from 'react-hook-form';
import { upsertCharacterEquipmentSchema, type UpsertCharacterEquipmentType } from '@/persistence/characterSchemas';
import { useFormMutation } from '@/infrastructure/hooks/useFormMutation';
import EditShieldView from '@/application/characters/edit/equipment/EditShieldView';
import EditWeaponView from '@/application/characters/edit/equipment/EditWeaponView';
import EditArmorView from '@/application/characters/edit/equipment/EditArmorView';
import bffClient from '@/infrastructure/bffClient';
import EditHorseView from './EditHorseView';
import AppendToArrayButton from '@/common/components/ui/AppendToArrayButton';
import SubmitButton from '@/common/components/ui/SubmitButton';
import ItemsView from '@/application/characters/equipment/ItemsView';
import EditItemSheet from '@/application/characters/edit/equipment/EditItemSheet';
import EditInventoryItemView from './EditInventoryItemView';

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

          <AddWeaponButton isPending={isPending} />

          <ItemsView
            items={input.character.equipment.weapons}
            label="Bronie"
            itemViewFactory={(item, index) => <EditWeaponView equipmentFormName={equipmentFormName} index={index} weapon={item} isPending={isPending} />}
          />

          <ItemsView
            items={input.character.equipment.armors}
            label="Zbroje"
            itemViewFactory={(item, index) => <EditArmorView equipmentFormName={equipmentFormName} index={index} armor={item} isPending={isPending} />}
          />

          <ItemsView
            items={input.character.equipment.shields}
            label="Tarcze"
            itemViewFactory={(item, index) => <EditShieldView equipmentFormName={equipmentFormName} index={index} shield={item} isPending={isPending} />}
          />

          <ItemsView
            items={input.character.equipment.inventory}
            label="Wyposażenie"
            itemViewFactory={(item, index) => <EditInventoryItemView equipmentFormName={equipmentFormName} index={index} inventory={item} isPending={isPending} />}
          />

          <ItemsView
            items={input.character.equipment.horses}
            label="Konie"
            itemViewFactory={(item, index) => <EditHorseView key={index} index={index} equipmentFormName={equipmentFormName} horse={item} isPending={isPending} />}
          />

        </Accordion>

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};

type AddWeaponButtonProps =
{
  isPending: boolean;
}

function AddWeaponButton({ isPending }: AddWeaponButtonProps)
{
  const { append } = useFieldArray<UpsertCharacterEquipmentType>({ name: "weapons" });

  const defaultWeapon: Weapon =
  {
    name: "Nowa broń",
    description: "",
    style: "Jednoręczny",
    range: 1,
    damageBonus: { amount: 1, grade: 6, bonus: 0 },
    offense: { amount: 1, grade: 6, bonus: 0, critical: { range: 20, power: 2 } },
  }

  return (
    <AppendToArrayButton<UpsertCharacterEquipmentType, "weapons"> 
      isPending={isPending}
      variant='outline'
      append={append}
      toAdd={defaultWeapon}
    />
  );
}