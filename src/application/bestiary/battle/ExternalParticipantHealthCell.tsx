"use client";

import { useState } from "react";
import { ExternalParticipant } from "@/application/bestiary/battle/BattleCombatants";
import { Input } from "@/common/components/ui/input";

type ExternalParticipantHealthCellProps = 
{
  participant: ExternalParticipant;
};

export default function ExternalParticipantHealthCell({ participant }: ExternalParticipantHealthCellProps) 
{
  const [health, setHealth] = useState((participant.maxHealth ?? 0).toString());

  return (
    <>
      <div className="flex flex-row gap-2 place-items-center">
        <Input 
            id="health" 
            type="number" 
            value={health} 
            onChange={e => setHealth(e.target.value)} 
            className="w-17"
        /> 
        <div>
        / {participant.maxHealth}
        </div>
      </div>
    </>
  );
}
