"use client";

import { Character } from '@/domain/characters/Character';
import { Accordion } from "@/ui/accordion"
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
import AppendToArrayButton from '@/common/components/ui/AppendToArrayButton';
import SubmitButton from '@/common/components/ui/SubmitButton';
import ItemsView from '@/application/characters/equipment/ItemsView';
import EditInventoryItemView from './EditInventoryItemView';
import { CreateDefaultArmor, CreateDefaultHorse, CreateDefaultInventoryItem, CreateDefaultShield, CreateDefaultWeapon } from '@/domain/data/defaults';

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

          <ItemsView
            items={input.character.equipment.weapons}
            label="Bronie"
            itemViewFactory={(item, index) => <EditWeaponView equipmentFormName={equipmentFormName} index={index} weapon={item} isPending={isPending} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "weapons"> 
              isPending={isPending}
              variant='outline'
              name={"weapons"}
              toAdd={CreateDefaultWeapon()}
            />
          </ItemsView>

          <ItemsView
            items={input.character.equipment.armors}
            label="Zbroje"
            itemViewFactory={(item, index) => <EditArmorView equipmentFormName={equipmentFormName} index={index} armor={item} isPending={isPending} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "armors"> 
              isPending={isPending}
              variant='outline'
              name={"armors"}
              toAdd={CreateDefaultArmor()}
            />
          </ItemsView>

          <ItemsView
            items={input.character.equipment.shields}
            label="Tarcze"
            itemViewFactory={(item, index) => <EditShieldView equipmentFormName={equipmentFormName} index={index} shield={item} isPending={isPending} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "shields"> 
              isPending={isPending}
              variant='outline'
              name={"shields"}
              toAdd={CreateDefaultShield()}
            />
          </ItemsView>

          <ItemsView
            items={input.character.equipment.inventory}
            label="Wyposażenie"
            itemViewFactory={(item, index) => <EditInventoryItemView equipmentFormName={equipmentFormName} index={index} inventory={item} isPending={isPending} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "inventory"> 
              isPending={isPending}
              variant='outline'
              name={"inventory"}
              toAdd={CreateDefaultInventoryItem()}
            />
          </ItemsView>

          <ItemsView
            items={input.character.equipment.horses}
            label="Konie"
            itemViewFactory={(item, index) => <EditHorseView key={index} index={index} equipmentFormName={equipmentFormName} horse={item} isPending={isPending} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "horses"> 
              isPending={isPending}
              variant='outline'
              name={"horses"}
              toAdd={CreateDefaultHorse()}
            />
          </ItemsView>

        </Accordion>

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};
