"use client";

import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { canUseCastable, EndTurn } from '@/domain/characters/Castable';
import { getBadgeVariant, getCastTimeColors } from '@/presentation/colors';
import { useState } from 'react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { battleIcon, cooldownIcon, nextIcon, removePreviousIcon, resetIcon } from "@/presentation/icons";
import { displayedText } from "@/presentation/translations";

type ManeuversViewProps =
{
    maneuvers: Maneuver[];
}

export default function ManeuversCard({ maneuvers }: ManeuversViewProps)
{
  const [usedManeuvers, setUsedManeuvers] = useState<(Maneuver | EndTurn)[]>([]);

  const addManeuverToUsed = (maneuver: Maneuver | EndTurn) =>
  {
    setUsedManeuvers(prev => [...prev, maneuver]);
  }

  const removeLastManeuver = () =>
  {
    setUsedManeuvers(prev => prev.slice(0, -1));
  }

  const endTurn = () =>
  {
    setUsedManeuvers(prev => [...prev, "end"]);
  }
    
  return (
    <Card className='bg-muted'>

        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{displayedText.maneuvers}</CardTitle>
        </CardHeader>

        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'>
        {
            maneuvers.map(maneuver => <ManeuverView key={maneuver.name} maneuver={maneuver} addManeuverToUsed={addManeuverToUsed} usedManeuvers={usedManeuvers} />)
        }

        <div className="grid grid-cols-13 items-center justify-center gap-3 mt-3 pt-4 border-t border-border/40 col-span-full">

            <Button variant="default" className='col-span-1' onClick={() => setUsedManeuvers([])}>
                {resetIcon()}
            </Button>

            <p className="text-sm col-span-10">
                <span className='text-muted-foreground italic'>
                {
                    usedManeuvers.map((usedManeuver, index) => 
                    {
                        if (usedManeuver === "end") return (
                            <Badge key={index} variant="destructive" className='m-1' >
                                {nextIcon()}
                            </Badge>
                        );;

                        return (
                            <Badge key={index} variant={getBadgeVariant(usedManeuver.castTime)} className='m-1' >
                                {usedManeuver.name}
                            </Badge>
                        );
                    })
                }
                </span>
            </p>

            <Button variant="default" className='col-span-1' onClick={removeLastManeuver}>
                {removePreviousIcon()}
            </Button>

            <Button variant="default" className='col-span-1' onClick={endTurn}>
                {nextIcon()}
            </Button>
        </div>

        </CardContent>

    </Card>
  );
};

type ManeuverViewProps =
{
    maneuver: Maneuver;
    addManeuverToUsed: (maneuver: Maneuver | EndTurn) => void;
    usedManeuvers: (Maneuver | EndTurn)[];
}

function ManeuverView({ maneuver, addManeuverToUsed, usedManeuvers }: ManeuverViewProps) 
{
    return (
        <div className='flex m-1 p-1 w-full h-full'>

            <div className='flex items-center justify-center p-2 border rounded-l-md flex-1'>
                <FieldViewWithInfo
                    value={maneuver.grade}
                    infoContent={<div> <span className='capitalize'>{displayedText.action}</span>  <span className={`${getCastTimeColors(maneuver.castTime).text}`}>{maneuver.castTime.toLowerCase()}</span>. {maneuver.description}</div>}
                    className="gap-1"
                    nameClassName='w-4xs'
                >
                    {maneuver.name}
                </FieldViewWithInfo>
            </div>

            <div className='flex items-center justify-center border rounded-r-md border-l-0'>
                <Button variant="ghost" className="h-full w-full p-0" onClick={() => addManeuverToUsed(maneuver)} disabled={!canUseCastable(maneuver, usedManeuvers)}>
                    <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-l-none rounded-r-md' variant={getBadgeVariant(maneuver.castTime)}>
                        {cooldownIcon()}
                        <span>{maneuver.cooldown || battleIcon("scale-80")}</span>
                    </Badge>
                </Button>
            </div>

        </div>
    );
}
