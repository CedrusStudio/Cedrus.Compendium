"use client";

import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/common/translations';
import { PerkDto } from "@/persistence/schemas/characters/perkSchema";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import RequirementListField from "@/application/common/requirements/RequirementListField";
import ReplacesListField from "@/application/common/replaces/ReplacesListField";
import { PropsWithChildren } from "react";
import AddSheet from "@/common/components/sheets/AddSheet";
import { RequirementEntityType } from "@/common/hooks/useEntityRequirements";

type PerkableAddSheetProps =
{
  isPending: boolean;
  formId: string;
  title: string;
  entityType?: RequirementEntityType;
}

export default function PerkableAddSheet({ isPending, formId, title, entityType, children }: PropsWithChildren<PerkableAddSheetProps>)
{
  return (
    <AddSheet isPending={isPending} formId={formId} title={title}>

      <div className="flex justify-around">

        <div className="grid auto-rows-min gap-3 px-4">
          <Label className='capitalize'>{displayedText.name}</Label>
          <InputFormField<PerkDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
        </div>
  
        <div className="grid auto-rows-min gap-3 px-4">
          <Label className='capitalize'>{displayedText.grade}</Label>
          <InputFormField<PerkDto> path='grade' numeric inputClassName="w-11 h-10 text-center font-medium" />
        </div>

      </div>

      <div className="grid auto-rows-min gap-3 px-4">
        <Label className='capitalize'>{displayedText.description}</Label>
        <InputFormField<PerkDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
      </div>

      <FormTagsInput<PerkDto> path='tags' entityType={entityType} />
      <RequirementListField />

      {/* Replacements target the same kind of entity, so the group comes from
          `entityType`; without it there is nothing sensible to suggest. */}
      {entityType && <ReplacesListField group={entityType} />}

      <div className="grid auto-rows-min gap-3">
        <Label className='justify-center capitalize'>{displayedText.price}</Label>
        <InputFormField<PerkDto> path='price' numeric inputClassName='w-11 h-10 text-center font-medium'  />
      </div>

      {children}

    </AddSheet>
  )
}
