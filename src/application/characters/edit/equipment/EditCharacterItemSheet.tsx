import { EditSheet } from "@/common/components/sheets/EditSheet";
import { PropsWithChildren } from 'react';
import { EquipmentItemTypes } from "@/domain/characters/equipment/Equipment";
import { displayedText } from "@/presentation/translations";
import ItemEditableFields from "@/application/common/equipment/EditSheets/ItemEditableFields";

type EditItemSheetProps = 
{
  type: EquipmentItemTypes;
};

export default function EditCharacterItemSheet({ type, children }: PropsWithChildren<EditItemSheetProps>)
{
  return (
    <EditSheet
      title={displayedText.editingItem}
      isPending={false}
      formId="equipment-form"
      triggerVariant="outline"
      hasSubmitButton={false}
    >
      <ItemEditableFields pathPrefix={`${type}.`} />
      {children}
    </EditSheet>
  )
}