"use client";

import { EditSheet } from '@/common/components/sheets/EditSheet';
import { PropsWithChildren } from 'react';
import PerkEditableFields from '@/application/common/PerkEditableFields';

export type CombatPerksTypes = `maneuvers.${number}` | `stances.${number}` | `states.${number}` | `powers.${number}.spells.${number}`;

type EditCombatSheetProps = 
{
   type: CombatPerksTypes;
   displayedTitle: string;
};

export default function EditCharacterCombatPerkSheet({ type, displayedTitle, children }: PropsWithChildren<EditCombatSheetProps>)
{
    return (
        <EditSheet
            title={displayedTitle}
            isPending={false}
            formId="combat-form"
            triggerVariant="outline"
            hasSubmitButton={false}
        >
            <PerkEditableFields pathPrefix={`${type}.`} />
            {children}
        </EditSheet>
    )
}