"use client";

import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { PropsWithChildren } from 'react';
import PerkEditableFields from '@/application/common/PerkEditableFields';

export type CombatPerksTypes = `maneuvers.${number}` | `stances.${number}` | `states.${number}` | `powers.${number}.spells.${number}`;

type EditCombatSheetProps = 
{
   type: CombatPerksTypes;
};

export default function EditCharacterCombatPerkSheet({ type, children }: PropsWithChildren<EditCombatSheetProps>)
{
    return (
        <Sheet>

            <SheetTrigger asChild>
                <Button variant="outline" size='icon' type="button">{editIcon}</Button>
            </SheetTrigger>

            <SheetContent>
                
                <SheetHeader>
                    <SheetTitle className='first-letter:uppercase'>{displayedText.editManeuver}</SheetTitle>
                    <SheetDescription>
                        {displayedText.clickSave}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-3 px-4">
                    <PerkEditableFields pathPrefix={`${type}.`} />
                    {children}
                </div>

                <SheetFooter>
                    <SheetClose className="capitalize" asChild>
                        <Button variant="outline" type='button'>{displayedText.close}</Button>
                    </SheetClose>
                </SheetFooter>

            </SheetContent>
        </Sheet>
  )
}