"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Maneuver, type CastTime } from '@/domain/Character';
import FieldViewWithInfo from "@/components/character/FieldViewWithInfo";
import { LuRefreshCcw } from "react-icons/lu";
import { GiSwordsEmblem } from "react-icons/gi";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RiResetLeftFill } from "react-icons/ri";
import { FiMinus } from "react-icons/fi";
import { Badge } from '@/components/ui/badge';

type ManeuversViewProps =
{
    maneuvers: Maneuver[];
}

export default function ManeuversView({ maneuvers }: ManeuversViewProps)
{
  const [usedManeuvers, setUsedManeuvers] = useState<Maneuver[]>([]);

  const addManeuverToUsed = (maneuver: Maneuver) =>
  {
      setUsedManeuvers(prev => [...prev, maneuver]);
  }

  const removeLastManeuver = () =>
  {
      setUsedManeuvers(prev => prev.slice(0, -1));
  }
    
  return (
    <Card className='bg-muted'>

        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Maneuvers</CardTitle>
        </CardHeader>

        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 '>
        {
            maneuvers.map(maneuver => <ManeuverView key={maneuver.name} maneuver={maneuver} addManeuverToUsed={addManeuverToUsed} usedManeuvers={usedManeuvers} />)
        }

        <div className="grid grid-cols-12 items-center justify-center gap-3 mt-3 pt-4 border-t border-border/40 col-span-full">

            <Button variant="default" className='col-span-1' onClick={() => setUsedManeuvers([])}>
                <RiResetLeftFill />
            </Button>

            <p className="text-sm col-span-10">
                <span className='text-muted-foreground italic'>
                {
                    usedManeuvers.map((usedManeuver, index) => (
                        <Badge key={index} variant={getBadgeVariant(usedManeuver.castTime)} className='m-1' >
                            {usedManeuver.name}
                        </Badge>
                    ))
                }
                </span>
            </p>

            <Button variant="default" className='col-span-1' onClick={removeLastManeuver}>
                <FiMinus />
            </Button>
        </div>

        </CardContent>

    </Card>
  );
};

function ManeuverView({ maneuver, addManeuverToUsed, usedManeuvers }: { maneuver: Maneuver, addManeuverToUsed: (maneuver: Maneuver) => void, usedManeuvers: Maneuver[] }) 
{
    return (
        <div className='flex m-1 p-1 w-full h-full'>

            <div className='flex items-center justify-center p-2 border rounded-l-md flex-1'>
                <FieldViewWithInfo
                    name={maneuver.name}
                    value={maneuver.grade}
                    infoContent={`${maneuver.castTime} Action. ${maneuver.description}`}
                    className="gap-1"
                    nameClassName='w-4xs'
                    />
            </div>

            <div className='flex items-center justify-center border rounded-r-md border-l-0'>
                <Button variant="ghost" className="h-full w-full p-0" onClick={() => addManeuverToUsed(maneuver)} disabled={!canUseManeuver(maneuver, usedManeuvers)}>
                    <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-l-none rounded-r-md' variant={getBadgeVariant(maneuver.castTime)}>
                        <LuRefreshCcw />
                        <span>{maneuver.cooldown ?? <GiSwordsEmblem className='bg- scale-80'/>}</span> 
                    </Badge>
                </Button>
            </div>

        </div>
    );
}

type BadgeActionVariant = "full" | "standard" | "immediate" | "overimmediate" | null | undefined

function getBadgeVariant(castTime: CastTime): BadgeActionVariant
{
    if (castTime === "Full") return "full";
    if (castTime === "Standard") return "standard";
    if (castTime === "Immediate") return "immediate";
    if (castTime === "Overimmediate") return "overimmediate";
    return null;
}

function canUseManeuver(maneuver: Maneuver, usedManeuvers: Maneuver[]): boolean
{
    if (usedManeuvers.length === 0) return true;

    if (maneuver.cooldown)
    {
        const lastUsedIndex = usedManeuvers.findLastIndex(x => x.name === maneuver.name);
        if (lastUsedIndex === -1) return true;
        const maneuversSinceLastUse = usedManeuvers.length -  lastUsedIndex;
        return maneuversSinceLastUse >= maneuver.cooldown;
    }

    return !usedManeuvers.some(x => x.name === maneuver.name);
}