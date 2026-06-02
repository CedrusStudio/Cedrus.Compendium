"use client";

import { Mode, ModesType, pathToMode } from "@/domain/characters/combat/Mode";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import RemovedBadge from '@/common/components/labels/RemovedBadge';
import SummaryView from "@/application/common/SummaryView";
import EditCharacterCombatPerkSheet from "./EditCharacterCombatPerkSheet";
import { displayedText } from "@/common/translations";
import PerkableEditView from '@/application/characters/edit/combat/PerkableEditView';
import RestoreItemButton from '@/common/components/form/RestoreItemButton';

type EditModeViewProps =
{ 
  mode: Mode,
  modeType: ModesType; 
  index: number; 
  isImported: boolean;
  isRemoved: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
}

export default function EditModeView({ mode, modeType, index, isImported, isRemoved, onRemove, onRestore }: EditModeViewProps)
{ 
  return (
    <PerkableEditView>

      <SummaryView entity={mode} tagsVariant="outline" />
      {isRemoved ? <RemovedBadge /> : <ImportedBadge isImported={isImported} />}

      <div className="flex flex-row gap-2">
        {isRemoved ? <RestoreItemButton onRestore={onRestore ?? (() => {})} /> : <RemoveFromArrayButton onRemove={onRemove} />}
        {!isRemoved && !isImported && <EditModeSheet index={index} modeType={modeType} />}
      </div>

    </PerkableEditView>
  );
}

type EditModeSheetProps = 
{
  modeType: ModesType;
  index: number;
};

function EditModeSheet({ index, modeType }: EditModeSheetProps)
{
  const type = pathToMode(index, modeType);
  const displayedTitle = modeType === 'stances' ? displayedText.editStance : displayedText.editState
  return <EditCharacterCombatPerkSheet type={type} displayedTitle={displayedTitle} />;
}