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
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import SubmitButton from '@/common/components/form/SubmitButton';
import ItemsView from '@/application/characters/equipment/ItemsView';
import EditInventoryItemView from '@/application/characters/edit/equipment/EditInventoryItemView';
import { CreateDefaultArmor, CreateDefaultHorse, CreateDefaultInventoryItem, CreateDefaultShield, CreateDefaultWeapon } from '@/domain/data/defaults';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';

const equipmentFormName = "edit-equipment-form";

export default function EditEquipmentView(input: { character: Character })
{
  const initialValues: UpsertCharacterEquipmentType = input.character.equipment;
  const form = useForm<UpsertCharacterEquipmentType>
  ({
    resolver: zodResolver(upsertCharacterEquipmentSchema),
    defaultValues: initialValues,
  });

  const { watchedArray: weapons, append: appendWeapon } = useWatchedFormArray("weapons", form.control);
  const { watchedArray: armors, append: appendArmor } = useWatchedFormArray("armors", form.control);
  const { watchedArray: shields, append: appendShield } = useWatchedFormArray("shields", form.control);
  const { watchedArray: inventory, append: appendInventory } = useWatchedFormArray("inventory", form.control);
  const { watchedArray: horses, append: appendHorse } = useWatchedFormArray("horses", form.control);

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
            items={weapons}
            label="Bronie"
            itemViewFactory={(item, index) => <EditWeaponView index={index} weapon={item} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "weapons"> 
              isPending={isPending}
              append={appendWeapon}
              toAdd={CreateDefaultWeapon}
            />
          </ItemsView>

          <ItemsView
            items={armors}
            label="Zbroje"
            itemViewFactory={(item, index) => <EditArmorView index={index} armor={item} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "armors"> 
              isPending={isPending}
              append={appendArmor}
              toAdd={CreateDefaultArmor}
            />
          </ItemsView>

          <ItemsView
            items={shields}
            label="Tarcze"
            itemViewFactory={(item, index) => <EditShieldView index={index} shield={item} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "shields"> 
              isPending={isPending}
              append={appendShield}
              toAdd={CreateDefaultShield}
            />
          </ItemsView>

          <ItemsView
            items={inventory}
            label="Wyposażenie"
            itemViewFactory={(item, index) => <EditInventoryItemView index={index} inventory={item} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "inventory"> 
              isPending={isPending}
              append={appendInventory}
              toAdd={CreateDefaultInventoryItem}
            />
          </ItemsView>

          <ItemsView
            items={horses}
            label="Konie"
            itemViewFactory={(item, index) => <EditHorseView key={index} index={index} horse={item} />}
          >
            <AppendToArrayButton<UpsertCharacterEquipmentType, "horses"> 
              isPending={isPending}
              append={appendHorse}
              toAdd={CreateDefaultHorse}
            />
          </ItemsView>

        </Accordion>

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};
