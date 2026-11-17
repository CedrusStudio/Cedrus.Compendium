"use client";

import { useGetCharacterById } from "@/application/characters/hooks/useGetCharacterById";
import { buildSheetModel } from "@/domain/characters/sheet/sheetModel";
import { applyActiveBuffProfile } from "@/domain/characters/buffs/applyBuffProfile";
import { SheetOptions } from "@/domain/characters/sheet/sheetOptions";
import CharacterSheet from "@/application/characters/sheet/CharacterSheet";
import SheetToolbar from "@/application/characters/sheet/SheetToolbar";
import NotFound from "@/common/components/NotFound";
import { displayedText } from "@/common/translations";
import CharacterLoading from '@/application/characters/CharacterLoading';

type CharacterSheetViewProps =
{
  options: SheetOptions;
  /**
   * Supplied by the server page so the printed date is decided once. Deriving it
   * client-side would make the header differ between the prefetched HTML and the
   * hydrated render on either side of midnight.
   */
  generatedOn?: Date;
};

export default function CharacterSheetView({ options, generatedOn }: CharacterSheetViewProps)
{
  const { character, isPending } = useGetCharacterById();

  if (isPending) return <CharacterLoading />;
  if (!character) return <NotFound subject={displayedText.character} />;

  // Same call as `CharacterView`: the printed numbers must match what the app
  // shows for the same character, so active profiles are folded in rather than
  // listed alongside base values. Deactivate a profile and it leaves the sheet.
  const model = buildSheetModel(applyActiveBuffProfile(character), { generatedOn });

  return (
    <>
      <SheetToolbar characterId={character.id} options={options} />
      <div className="sheet-preview" data-horizontal-scroll role="region" aria-label="Podgląd karty A4 — przewijanie poziome" tabIndex={0}>
        <CharacterSheet model={model} options={options} />
      </div>
    </>
  );
};
