"use client";

import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { canUseManeuver, type CastTime, EndTurn, Maneuver } from '@/domain/characters/combat/Maneuver';
import { getCastTimeColors } from '@/presentation/colors';
import { LuRefreshCcw } from "react-icons/lu";
import { useState } from 'react';
import { Button } from '@/ui/button';
import { RiResetLeftFill } from "react-icons/ri";
import { RiDeleteBack2Line } from "react-icons/ri";
import { Badge } from '@/ui/badge';
import { GrNext } from "react-icons/gr";
import { battleIcon } from "@/presentation/icons";
import { displayedText } from "@/presentation/translations";

type ManeuversViewProps =
{
    maneuvers: Maneuver[];
}

export default function ManeuversView({ maneuvers }: ManeuversViewProps)
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
                <RiResetLeftFill />
            </Button>

            <p className="text-sm col-span-10">
                <span className='text-muted-foreground italic'>
                {
                    usedManeuvers.map((usedManeuver, index) => 
                    {
                        if (usedManeuver === "end") return (
                            <Badge key={index} variant="destructive" className='m-1' >
                                <GrNext />
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
                <RiDeleteBack2Line />
            </Button>

            <Button variant="default" className='col-span-1' onClick={endTurn}>
                <GrNext />
            </Button>
        </div>

        </CardContent>

    </Card>
  );
};

function ManeuverView({ maneuver, addManeuverToUsed, usedManeuvers }: { maneuver: Maneuver, addManeuverToUsed: (maneuver: Maneuver | EndTurn) => void, usedManeuvers: (Maneuver | EndTurn)[] }) 
{
    return (
        <div className='flex m-1 p-1 w-full h-full'>

            <div className='flex items-center justify-center p-2 border rounded-l-md flex-1'>
                <FieldViewWithInfo
                    value={maneuver.grade}
                    infoContent={<span className='capitalize'>{displayedText.action} <span className={`${getCastTimeColors(maneuver.castTime).text}`}>{maneuver.castTime.toLowerCase()}</span>. {maneuver.description}</span>}
                    className="gap-1"
                    nameClassName='w-4xs'
                >
                    {maneuver.name}
                </FieldViewWithInfo>
            </div>

            <div className='flex items-center justify-center border rounded-r-md border-l-0'>
                <Button variant="ghost" className="h-full w-full p-0" onClick={() => addManeuverToUsed(maneuver)} disabled={!canUseManeuver(maneuver, usedManeuvers)}>
                    <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-l-none rounded-r-md' variant={getBadgeVariant(maneuver.castTime)}>
                        <LuRefreshCcw />
                        <span>{maneuver.cooldown || battleIcon("scale-80")}</span>
                    </Badge>
                </Button>
            </div>

        </div>
    );
}

type BadgeActionVariant = "full" | "standard" | "immediate" | "overimmediate" | null | undefined

function getBadgeVariant(castTime: CastTime): BadgeActionVariant
{
    if (castTime === "Pełnorundowa") return "full";
    if (castTime === "Standardowa") return "standard";
    if (castTime === "Natychmiastowa") return "immediate";
    if (castTime === "Nadnatychmiastowa") return "overimmediate";
    return null;
}