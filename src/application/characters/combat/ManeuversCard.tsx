"use client";

import { Field } from "@/common/components/fields";
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { canUseCastable, EndTurn, type CastTime } from '@/domain/characters/Castable';
import { getBadgeVariant, getCastTimeColors } from '@/common/colors';
import { useMemo, useState } from 'react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { battleIcon, cooldownIcon, nextIcon, removePreviousIcon, resetIcon } from "@/common/icons";
import { displayedText } from "@/common/translations";
import InfoContentWithTags from "@/common/components/tags/InfoContentWithTags";
import CastableSearchFilters from '@/application/characters/combat/CastableSearchFilters';
import { filterCastables, getAvailableCastableTags } from '@/application/characters/combat/castableFilters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/common/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

type ManeuversViewProps =
{
    maneuvers: Maneuver[];
}

export default function ManeuversCard({ maneuvers }: ManeuversViewProps)
{
  const [usedManeuvers, setUsedManeuvers] = useState<(Maneuver | EndTurn)[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [selectedCastTimes, setSelectedCastTimes] = useState<CastTime[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const availableTags = useMemo(() => getAvailableCastableTags(maneuvers), [maneuvers]);
    const filteredManeuvers = useMemo(() => filterCastables(maneuvers,
    {
        searchTerm: searchInput,
        selectedCastTimes,
        selectedTags,
    }), [maneuvers, searchInput, selectedCastTimes, selectedTags]);

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

        <CardHeader className='gap-4'>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{displayedText.maneuvers}</CardTitle>

            {
                maneuvers.length > 0 && (
                    <CastableSearchFilters
                        searchInput={searchInput}
                        onSearchInputChange={setSearchInput}
                        selectedCastTimes={selectedCastTimes}
                        onSelectedCastTimesChange={setSelectedCastTimes}
                        selectedTags={selectedTags}
                        onSelectedTagsChange={setSelectedTags}
                        availableTags={availableTags}
                    />
                )
            }
        </CardHeader>

        <CardContent>
          {/* ROADMAP 2.6 — search/filters above stay visible; the maneuver grid
              itself collapses to cut down on scroll once the player has picked
              their actions for the turn. Open by default — nothing is hidden
              unless the player chooses to collapse it. */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 h-7 gap-1 px-2 text-xs text-muted-foreground [&[data-state=open]_svg]:rotate-180"
              >
                <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                {displayedText.maneuvers}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'>
                {
                    filteredManeuvers.map(maneuver => <CombatManeuverView key={maneuver.id} maneuver={maneuver} addManeuverToUsed={addManeuverToUsed} usedManeuvers={usedManeuvers} />)
                }

                {
                    filteredManeuvers.length === 0 && (
                        <p className='col-span-full text-center text-sm text-muted-foreground'>
                            {displayedText.no_maneuvers_found}
                        </p>
                    )
                }

                <SmallUsedManeuversView usedManeuvers={usedManeuvers} removeLastManeuver={removeLastManeuver} setUsedManeuvers={setUsedManeuvers} endTurn={endTurn} />
                <MediumUsedManeuversView usedManeuvers={usedManeuvers} removeLastManeuver={removeLastManeuver} setUsedManeuvers={setUsedManeuvers} endTurn={endTurn} />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>

    </Card>
  );
};

type UsedManeuversViewProps =
{
    usedManeuvers: (Maneuver | EndTurn)[];
    removeLastManeuver: () => void;
    setUsedManeuvers: (usedManeuvers: (Maneuver | EndTurn)[]) => void;
    endTurn: () => void;
}

function SmallUsedManeuversView({ usedManeuvers, removeLastManeuver, setUsedManeuvers, endTurn }: UsedManeuversViewProps)
{
    return (
        <div className="lg:grid-cols-13 col-span-full lg:hidden">
            
            <div className="text-sm lg:col-span-10 text-muted-foreground italic flex flex-wrap sm:gap-1 lg:gap-2 py-2">
            {
                usedManeuvers.map((usedManeuver, index) => 
                {
                    if (usedManeuver === "end") return (
                        <Badge
                            key={index}
                            variant="destructive"
                            className="m-0.5 px-1 py-0.5 text-xs leading-tight h-auto min-w-0"
                        >
                            {nextIcon()}
                        </Badge>
                    );

                    return (
                        <Badge
                            key={index}
                            variant={getBadgeVariant(usedManeuver.castTime)}
                            className="m-0.5 px-1 py-0.5 text-xs leading-tight h-auto min-w-0"
                        >
                            {usedManeuver.name}
                        </Badge>
                    );
                })
            }
            </div>


            <div className="flex gap-4 justify-center items-center">
                <Button variant="default" className='flex-1 lg:flex-0' onClick={() => setUsedManeuvers([])}>
                    {resetIcon()}
                </Button>

                <Button variant="default" className='flex-1 lg:flex-0' onClick={removeLastManeuver}>
                    {removePreviousIcon()}
                </Button>

                <Button variant="default" className='flex-1 lg:flex-0' onClick={endTurn}>
                    {nextIcon()}
                </Button>
            </div>
        </div>
    );
}

function MediumUsedManeuversView({ usedManeuvers, removeLastManeuver, setUsedManeuvers, endTurn }: UsedManeuversViewProps)
{
    return (
        <div className="lg:grid grid-cols-13 items-center justify-center gap-3 mt-3 pt-4 border-t border-border/40 col-span-full hidden">

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
                        );

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
    );
}

type ManeuverViewProps =
{
    maneuver: Maneuver;
    addManeuverToUsed: (maneuver: Maneuver | EndTurn) => void;
    usedManeuvers: (Maneuver | EndTurn)[];
}

function CombatManeuverView({ maneuver, addManeuverToUsed, usedManeuvers }: ManeuverViewProps) 
{
    return (
        <div className='flex m-1 p-1 w-full h-full'>

            <div className='flex place-items-center place-content-center p-2 border rounded-l-md flex-1'>
                <Field value={maneuver.grade} className="gap-1">
                    <Field.Label className='w-4xs'>{maneuver.name}</Field.Label>
                    <Field.Value />
                    <Field.Info className={`${getCastTimeColors(maneuver.castTime).text}`}>
                        <InfoContentWithTags castable={maneuver} />
                    </Field.Info>
                </Field>
            </div>

            <div className='flex place-items-center place-content-center border rounded-r-md border-l-0'>
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
