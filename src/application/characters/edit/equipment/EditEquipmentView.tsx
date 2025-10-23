"use client";

import { Character } from '@/domain/characters/Character';
import { Accordion } from "@/ui/accordion"
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from 'react-hook-form';
import { equipmentSchema, type EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { useFormMutation } from '@/infrastructure/hooks/useFormMutation';
import EditShieldView from '@/application/characters/edit/equipment/EditShieldView';
import EditWeaponView from '@/application/characters/edit/equipment/EditWeaponView';
import EditArmorView from '@/application/characters/edit/equipment/EditArmorView';
import bffClient from '@/infrastructure/bffClient';
import EditMountView from '@/application/characters/edit/equipment/EditMountView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import SubmitButton from '@/common/components/form/SubmitButton';
import ItemsView from '@/application/characters/equipment/ItemsView';
import EditInventoryItemView from '@/application/characters/edit/equipment/EditInventoryItemView';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { CreateDefaultWeapon } from '@/domain/characters/equipment/Weapon';
import { CreateDefaultArmor } from '@/domain/characters/equipment/Armor';
import { CreateDefaultShield } from '@/domain/characters/equipment/Shield';
import { CreateDefaultInventoryItem } from '@/domain/characters/equipment/Item';
import { CreateDefaultMount } from '@/domain/characters/equipment/Mount';
import { displayedText } from '@/presentation/translations';

const equipmentFormName = "edit-equipment-form";

export default function EditEquipmentView(input: { character: Character })
{
  const initialValues: EquipmentDto = input.character.equipment;
  const form = useForm<EquipmentDto>
  ({
    resolver: zodResolver(equipmentSchema),
    defaultValues: initialValues,
  });

  const { watchedArray: weapons, append: appendWeapon } = useWatchedFormArray("weapons", form.control);
  const { watchedArray: armors, append: appendArmor } = useWatchedFormArray("armors", form.control);
  const { watchedArray: shields, append: appendShield } = useWatchedFormArray("shields", form.control);
  const { watchedArray: inventory, append: appendInventory } = useWatchedFormArray("inventory", form.control);
  const { watchedArray: mounts, append: appendMount } = useWatchedFormArray("mounts", form.control);

  const id = input.character.id;

  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterEquipment: EquipmentDto) => await bffClient.updateEquipment(id, characterEquipment),
    {
      invalidateOnSuccess: ['characters', `characters/${id}`, `characters/${id}/edit`],
      toastPosition: "bottom-left",
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} id={equipmentFormName} className="space-y-8">

        <Accordion type="single" collapsible className='w-90 sm:w-160 md:w-full'>

          <ItemsView
            items={weapons}
            label={displayedText.weapons}
            itemViewFactory={(item, index) => <EditWeaponView index={index} weapon={item} />}
          >
            <AppendToArrayButton<EquipmentDto, "weapons"> 
              isPending={isPending}
              append={appendWeapon}
              toAdd={CreateDefaultWeapon}
            />
          </ItemsView>

          <ItemsView
            items={armors}
            label={displayedText.armors}
            itemViewFactory={(item, index) => <EditArmorView index={index} armor={item} />}
          >
            <AppendToArrayButton<EquipmentDto, "armors"> 
              isPending={isPending}
              append={appendArmor}
              toAdd={CreateDefaultArmor}
            />
          </ItemsView>

          <ItemsView
            items={shields}
            label={displayedText.shields}
            itemViewFactory={(item, index) => <EditShieldView index={index} shield={item} />}
          >
            <AppendToArrayButton<EquipmentDto, "shields"> 
              isPending={isPending}
              append={appendShield}
              toAdd={CreateDefaultShield}
            />
          </ItemsView>

          <ItemsView
            items={inventory}
            label={displayedText.inventory}
            itemViewFactory={(item, index) => <EditInventoryItemView index={index} inventory={item} />}
          >
            <AppendToArrayButton<EquipmentDto, "inventory"> 
              isPending={isPending}
              append={appendInventory}
              toAdd={CreateDefaultInventoryItem}
            />
          </ItemsView>

          <ItemsView
            items={mounts}
            label={displayedText.mounts}
            itemViewFactory={(item, index) => <EditMountView key={index} index={index} mount={item} />}
          >
            <AppendToArrayButton<EquipmentDto, "mounts"> 
              isPending={isPending}
              append={appendMount}
              toAdd={CreateDefaultMount}
            />
          </ItemsView>

        </Accordion>

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};
