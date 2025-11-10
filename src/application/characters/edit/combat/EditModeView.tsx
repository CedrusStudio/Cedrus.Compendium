"use client";

import { UseFieldArrayRemove } from "react-hook-form";
import { Mode, ModesType, pathToMode } from "@/domain/characters/combat/Mode";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import SummaryView from "@/application/common/SummaryView";
import EditCharacterCombatPerkSheet from "./EditCharacterCombatPerkSheet";

type EditModeViewProps =
{ 
  mode: Mode,
  modeType: ModesType; 
  index: number; 
  remove: UseFieldArrayRemove;
  isImported: boolean;
}

export default function EditModeView({ mode, modeType, index, remove, isImported }: EditModeViewProps)
{ 
  return (
    <div className="flex flex-row gap-2 m-1 items-center border rounded-md p-2 min-h-24">

      <SummaryView entity={mode} tagsVariant="outline" />
      <ImportedBadge isImported={isImported} />

      <div className="flex flex-row gap-2">
        <RemoveFromArrayButton remove={remove} index={index} />
        {!isImported && <EditModeSheet mode={mode} index={index} modeType={modeType} />}
      </div>

    </div>
  );
}

type EditModeSheetProps = 
{
  mode: Mode;
  modeType: ModesType;
  index: number;
};

function EditModeSheet({ mode, index, modeType }: EditModeSheetProps)
{
  const type = pathToMode(index, modeType);
  return <EditCharacterCombatPerkSheet item={{ name: mode.name, description: mode.description, type }} />;
}