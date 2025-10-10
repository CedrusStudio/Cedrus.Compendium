"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import { Maneuver } from '@/domain/characters/Character';
import { getColorClasses, type CastTime } from '@/domain/data/castTimes';
import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import { LuRefreshCcw } from "react-icons/lu";
import { GiSwordsEmblem } from "react-icons/gi";
import { useState } from 'react';
import { Button } from '@/ui/button';
import { RiResetLeftFill } from "react-icons/ri";
import { RiDeleteBack2Line } from "react-icons/ri";
import { Badge } from '@/ui/badge';
import { GrNext } from "react-icons/gr";

type ManeuversViewProps =
{
    maneuvers: Maneuver[];
}

type EndTurn = "end";

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
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Manewry</CardTitle>
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
                    name={maneuver.name}
                    value={maneuver.grade}
                    infoContent={<span>Akcja <span className={`${getColorClasses(maneuver.castTime).text}`}>{maneuver.castTime.toLowerCase()}</span>. {maneuver.description}</span>}
                    className="gap-1"
                    nameClassName='w-4xs'
                />
            </div>

            <div className='flex items-center justify-center border rounded-r-md border-l-0'>
                <Button variant="ghost" className="h-full w-full p-0" onClick={() => addManeuverToUsed(maneuver)} disabled={!canUseManeuver(maneuver, usedManeuvers)}>
                    <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-l-none rounded-r-md' variant={getBadgeVariant(maneuver.castTime)}>
                        <LuRefreshCcw />
                        <span>{maneuver.cooldown || <GiSwordsEmblem className='scale-80'/>}</span> 
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

type ActionCounts = { full: number; standard: number; immediate: number; overimmediate: number };
type AllowedManeuverCombination = Readonly<ActionCounts>;

const MANEUVER_COMBINATION_PROFILES: readonly AllowedManeuverCombination[] = 
[
  { full: 0, standard: 0, immediate: 0, overimmediate: 3 },
  { full: 0, standard: 0, immediate: 2, overimmediate: 1 },
  { full: 0, standard: 1, immediate: 1, overimmediate: 1 },
  { full: 0, standard: 1, immediate: 0, overimmediate: 2 },
  { full: 1, standard: 0, immediate: 0, overimmediate: 1 },
] as const;

const castKey = (ct: CastTime): keyof ActionCounts =>
  ct === "Pełnorundowa" ? "full" 
    : ct === "Standardowa" ? "standard" 
        : ct === "Natychmiastowa" ? "immediate" 
            : "overimmediate";

const countActions = (maneuvers: Maneuver[]): ActionCounts => maneuvers.reduce<ActionCounts>((acc, m) => 
{
    acc[castKey(m.castTime)] += 1;
    return acc;
  }, { full: 0, standard: 0, immediate: 0, overimmediate: 0 });

const fitsProfile = (c: ActionCounts, p: AllowedManeuverCombination) =>
  c.full <= p.full && c.standard <= p.standard && c.immediate <= p.immediate && c.overimmediate <= p.overimmediate;

const canUseCastTime = (used: Maneuver[], next: CastTime) => 
{
  const c = countActions(used);
  const k = castKey(next);
  return MANEUVER_COMBINATION_PROFILES.some(p => fitsProfile(c, p) && (c[k] + 1) <= p[k]);
};

function canUseManeuver(maneuver: Maneuver, usedManeuvers: (Maneuver | EndTurn)[]): boolean
{
    if (usedManeuvers.length === 0) return true;
    const maneuversInCurrentTurn = getManeuversInCurrentTurn(usedManeuvers);
    if (usedInCurrentTurn(maneuversInCurrentTurn, maneuver.name)) return false;
    if (onCooldown(usedManeuvers, maneuver, maneuver.name)) return false;
    return canUseCastTime(maneuversInCurrentTurn, maneuver.castTime);
}

function getManeuversInCurrentTurn(usedManeuvers: (Maneuver | EndTurn)[]): Maneuver[]
{
    return usedManeuvers.slice(usedManeuvers.lastIndexOf("end") + 1) as Maneuver[];
}

function usedInCurrentTurn(maneuversInCurrentTurn: Maneuver[], name: string): boolean
{
    return maneuversInCurrentTurn.some(x => x.name === name);
}

function onCooldown(usedManeuvers: (Maneuver | EndTurn)[], maneuver: Maneuver, name: string): boolean
{
    const lastUsedIndex = usedManeuvers.findLastIndex(x => (x !== "end" && x.name === name));
    if (lastUsedIndex === -1) return false;
    if (!maneuver.cooldown) return true;
    const turnCountSinceLastUse = usedManeuvers.slice(lastUsedIndex).filter(x => x === "end").length;
    return turnCountSinceLastUse < maneuver.cooldown;
}
