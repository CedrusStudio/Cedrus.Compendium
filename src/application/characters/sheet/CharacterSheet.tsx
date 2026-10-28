import { SheetModel } from "@/domain/characters/sheet/sheetModel";
import { isSectionEnabled, SheetOptions } from "@/domain/characters/sheet/sheetOptions";
import HeaderSection from "@/application/characters/sheet/sections/HeaderSection";
import StatsSection from "@/application/characters/sheet/sections/StatsSection";
import VitalsSection from "@/application/characters/sheet/sections/VitalsSection";
import DefensesSection from "@/application/characters/sheet/sections/DefensesSection";
import OffensesSection from "@/application/characters/sheet/sections/OffensesSection";
import EquipmentSection from "@/application/characters/sheet/sections/EquipmentSection";
import ActionsSection from "@/application/characters/sheet/sections/ActionsSection";
import PerksSection from "@/application/characters/sheet/sections/PerksSection";
import BuffsSection from "@/application/characters/sheet/sections/BuffsSection";
import DescriptionSection from "@/application/characters/sheet/sections/DescriptionSection";
import NotesSection from "@/application/characters/sheet/sections/NotesSection";
import PowersSection from "@/application/characters/sheet/sections/PowersSection";
import TalentsSection from "@/application/characters/sheet/sections/TalentsSection";
import AppendixSection from "@/application/characters/sheet/sections/AppendixSection";

type CharacterSheetProps =
{
  model: SheetModel;
  options: SheetOptions;
};

/**
 * The printed sheet, top to bottom.
 *
 * Page budget (print plan §4, adjusted 2026-08-04): the header down to the
 * notes shares at most two pages — that is the sheet a player keeps in front of
 * them. `ekwipunek`, `moce i zaklęcia` and `umiejętności` each start a fresh
 * page, as does the optional appendix; they are reference material consulted
 * between turns, not during them.
 *
 * Purely presentational: no state, no client boundary, no arithmetic. All of
 * that already happened in `buildSheetModel`.
 */
export default function CharacterSheet({ model, options }: CharacterSheetProps)
{
  return (
    <div className={options.symbolsOnly ? "sheet sheet-symbols-only" : "sheet"}>

      <HeaderSection header={model.header} />

      {isSectionEnabled(options, 'stats') && <StatsSection characteristics={model.characteristics} attributes={model.attributes} />}
      {isSectionEnabled(options, 'vitals') && <VitalsSection vitals={model.vitals} />}
      {isSectionEnabled(options, 'defenses') && <DefensesSection defenses={model.defenses} />}
      {isSectionEnabled(options, 'offenses') && <OffensesSection offenses={model.offenses} />}

      {
        isSectionEnabled(options, 'actions') && (
          <ActionsSection maneuvers={model.maneuvers} stances={model.stances} states={model.states} />
        )
      }

      {isSectionEnabled(options, 'perks') && <PerksSection perks={model.perks} />}
      {isSectionEnabled(options, 'buffs') && <BuffsSection buffs={model.buffs} />}
      {isSectionEnabled(options, 'description') && <DescriptionSection header={model.header} />}
      {isSectionEnabled(options, 'notes') && <NotesSection />}

      {isSectionEnabled(options, 'equipment') && <EquipmentSection equipment={model.equipment} />}
      {isSectionEnabled(options, 'powers') && <PowersSection powers={model.powers} />}
      {isSectionEnabled(options, 'talents') && <TalentsSection groups={model.talents} />}

      {options.appendix && <AppendixSection groups={model.appendix} />}

    </div>
  );
};
