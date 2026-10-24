
"use client";

import ItemAddSheet from "@/application/common/equipment/ItemAddSheet";
import { PropsWithChildren } from "react";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from "@/common/translations";
import { DefensiveItem } from "@/domain/characters/equipment/Item";

type ItemAddSheetProps = 
{
  isPending: boolean;
  formId: string;
  title: string;
}

export default function DefensiveItemAddSheet({ isPending, formId, title, children }: PropsWithChildren<ItemAddSheetProps>)
{
  return (
    <ItemAddSheet isPending={isPending} formId={formId} title={title}>

        <div className="grid grid-cols-2 gap-4 place-content-center place-items-center text-center">
            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='justify-center capitalize'>{displayedText.resistance}</Label>
                <InputFormField<DefensiveItem> path='resistance' numeric inputClassName='w-11 h-10 text-center font-medium' />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='text-xs capitalize'>{displayedText.strengthRequirement}</Label>
                <InputFormField<DefensiveItem> path='strengthRequirement' numeric inputClassName='w-11 h-10 text-center font-medium' />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 place-content-center place-items-center text-center">

            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='text-xs capitalize'>{displayedText.dexterityRestriction}</Label>
                <InputFormField<DefensiveItem> path='dexterityRestriction' numeric inputClassName='w-11 h-10 text-center font-medium' />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='text-xs capitalize'>{displayedText.reflexRestriction}</Label>
                <InputFormField<DefensiveItem> path='reflexRestriction' numeric inputClassName='w-11 h-10 text-center font-medium' />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 place-content-center place-items-center text-center">
            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='text-xs capitalize'>{displayedText.attributePenalty}</Label>
                <InputFormField<DefensiveItem> path='attributePenalty' numeric inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='text-xs capitalize'>{displayedText.initiativeRestriction}</Label>
                <InputFormField<DefensiveItem> path='initiativeRestriction' numeric inputClassName='w-11 h-10 text-center font-medium' />
            </div>
        </div>

      {children}
    </ItemAddSheet>
  );
};

