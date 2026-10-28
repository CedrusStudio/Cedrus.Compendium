"use client"

import { AccessorKeyColumnDef } from "@tanstack/react-table"
import { Talent } from "@/domain/characters/Talent"
import { useState } from "react"
import RollButton from "@/common/components/buttons/RollButton";
import VerticalChangeButtons from "@/common/components/buttons/VerticalChangeButtons";
import ResetButton from "@/common/components/buttons/ResetButton";
import { getColorTextChange } from "@/common/colors";
import { defaultColumns } from "@/application/characters/talents/defaultColumns"
import { displayedText } from "@/common/translations";
import { useOptionalDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { makeRollRecord, type RollPreset } from '@/domain/diceRoller';
import { Button } from '@/ui/button';
import { diceText } from '@/application/dice-roller/DiceRollerPanel';

export const columns: AccessorKeyColumnDef<Talent>[] = 
[
  ...defaultColumns,
  {
    id: "roll",
    cell: ({ row }) => <RollCell talent={row.original} />,
    header: () => <span className="capitalize">{displayedText.roll}</span>,
  },
] as AccessorKeyColumnDef<Talent>[];

function RollCell({ talent }: { talent: Talent })
{
  // Temporary roll modifier — mirrors the mechanism on Cechy/Atrybuty
  // (StatisticView): adjust the bonus for a single roll, reset to the sheet value.
  const defaultBonus = talent.bonus;
  const [bonus, setBonus] = useState(defaultBonus);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const diceRoller = useOptionalDiceRoller();
  const preset = (): RollPreset => ({ label: talent.name, pools: [{ label: talent.name, amount: 1, grade: talent.grade, bonus: 0, bonusScope: 'pool' }], modifier: bonus });

  const handleRoll = () =>
  {
    const die = Math.floor(Math.random() * talent.grade * 2) + 1;
    setRollResult(die + bonus);
    diceRoller?.record(makeRollRecord(preset(), [[{ value: die, critical: false }]]));
  };

  return (
    <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap">
      <span className="flex items-center whitespace-nowrap text-sm">
        1k{talent.grade * 2}
        <span className={`ml-0.5 ${getColorTextChange(bonus, defaultBonus)}`}>{bonus >= 0 ? "+" : ""}{bonus}</span>
      </span>
      <VerticalChangeButtons value={1} setValue={setBonus} />
      <ResetButton variant="ghost" defaultValuesWithSetters={[[defaultBonus, setBonus]]} />
      <RollButton onClick={handleRoll} rollResult={rollResult} />
      <Button variant="ghost" size="sm" aria-label={`${diceText.open}: ${talent.name}`} title={diceText.open} onClick={() => diceRoller?.open(preset())}>⋯</Button>
    </div>
  );
}
