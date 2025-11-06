"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { displayedText } from "@/presentation/translations";
import { Power, Spell } from "@/domain/characters/combat/Power";
import FieldViewWithInfo from '@/common/components/fields/FieldViewWithInfo';
import { getBadgeVariant } from '@/presentation/colors';
import { battleIcon, cooldownIcon, nextIcon, removePreviousIcon, resetIcon } from '@/presentation/icons';
import { canUseCastable, EndTurn } from '@/domain/characters/Castable';
import { useState } from 'react';
import InfoContentWithTags from '@/common/components/InfoContentWithTags';

type PowerCardProps =
{
    power: Power;
}

export default function PowerCard({ power }: PowerCardProps)
{
  const [usedSpells, setUsedSpells] = useState<(Spell | EndTurn)[]>([]);

  const addSpellToUsed = (spell: Spell | EndTurn) =>
  {
    setUsedSpells(prev => [...prev, spell]);
  }

  const removeLastSpell = () =>
  {
    setUsedSpells(prev => prev.slice(0, -1));
  }

  const endTurn = () =>
  {
    setUsedSpells(prev => [...prev, "end"]);
  }

  return (
    <Card className='bg-muted'>

        <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-center justify-between">

                <div className="flex justify-center items-center mx-auto mb-4 sm:mb-0 lg:pl-65">
                    <span className="capitalize font-bold text-2xl text-primary">{power.name}</span>
                </div>

                <div className='flex flex-row justify-center items-center gap-6'>
                    <div className="grid grid-cols-3 gap-6 justify-center items-center">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">{displayedText.level}</span>
                            <span className="font-bold text-lg text-primary">{power.level}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">{displayedText.bonus}</span>
                            <span className="font-bold text-lg text-primary">{power.bonus}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">{displayedText.essence}</span>
                            <span className="font-bold text-lg text-primary">{power.essence}</span>
                        </div>
                    </div>
                    <Badge variant="outline" className="px-4 py-2 mt-1 text-base capitalize">
                        {power.type}
                    </Badge>
                </div>

            </CardTitle>
        </CardHeader>

        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'>
        {
            power.spells.map(spell => <SpellView key={spell.name} spell={spell} addSpellToUsed={addSpellToUsed} usedSpells={usedSpells} />)
        }

        <MediumUsedSpellsView usedSpells={usedSpells} removeLastSpell={removeLastSpell} setUsedSpells={setUsedSpells} endTurn={endTurn} />
        <SmallUsedSpellsView usedSpells={usedSpells} removeLastSpell={removeLastSpell} setUsedSpells={setUsedSpells} endTurn={endTurn} />

        </CardContent>

    </Card>
  );
};

type UsedSpellsViewProps =
{
    usedSpells: (Spell | EndTurn)[];
    removeLastSpell: () => void;
    setUsedSpells: (usedSpells: (Spell | EndTurn)[]) => void;
    endTurn: () => void;
}

function SmallUsedSpellsView({ usedSpells, removeLastSpell, setUsedSpells, endTurn }: UsedSpellsViewProps)
{
    return (
        <div className="lg:grid-cols-13 col-span-full lg:hidden">

            <div className="text-sm lg:col-span-10 text-muted-foreground italic flex flex-wrap sm:gap-1 lg:gap-2 py-3">
            {
                usedSpells.map((usedSpell, index) => 
                {
                    if (usedSpell === "end") return (
                        <Badge key={index} variant="destructive" className='m-1' >
                            {nextIcon()}
                        </Badge>
                    );

                    return (
                        <Badge key={index} variant={getBadgeVariant(usedSpell.castTime)} className='m-1' >
                            {usedSpell.name}
                        </Badge>
                    );
                })
            }
            </div>

            <div className="flex gap-4 justify-center items-center">
                <Button variant="default" className='flex-1 lg:flex-0' onClick={() => setUsedSpells([])}>
                    {resetIcon()}
                </Button>

                <Button variant="default" className='flex-1 lg:flex-0' onClick={removeLastSpell}>
                    {removePreviousIcon()}
                </Button>

                <Button variant="default" className='flex-1 lg:flex-0' onClick={endTurn}>
                    {nextIcon()}
                </Button>
            </div>
        </div>
    );
}

function MediumUsedSpellsView({ usedSpells, removeLastSpell, setUsedSpells, endTurn }: UsedSpellsViewProps)
{
    return (
        <div className="hidden lg:grid grid-cols-13 items-center justify-center gap-3 mt-3 pt-4 border-t border-border/40 col-span-full">

            <Button variant="default" className='col-span-1' onClick={() => setUsedSpells([])}>
                {resetIcon()}
            </Button>

            <p className="text-sm col-span-10">
                <span className='text-muted-foreground italic'>
                {
                    usedSpells.map((usedSpell, index) => 
                    {
                        if (usedSpell === "end") return (
                            <Badge key={index} variant="destructive" className='m-1' >
                                {nextIcon()}
                            </Badge>
                        );

                        return (
                            <Badge key={index} variant={getBadgeVariant(usedSpell.castTime)} className='m-1' >
                                {usedSpell.name}
                            </Badge>
                        );
                    })
                }
                </span>
            </p>

            <Button variant="default" className='col-span-1' onClick={removeLastSpell}>
                {removePreviousIcon()}
            </Button>

            <Button variant="default" className='col-span-1' onClick={endTurn}>
                {nextIcon()}
            </Button>
        </div>
    );
}

type SpellViewProps =
{
    spell: Spell;
    addSpellToUsed: (spell: Spell | EndTurn) => void;
    usedSpells: (Spell | EndTurn)[];
}

function SpellView({ spell, addSpellToUsed, usedSpells }: SpellViewProps) 
{
    return (
        <div className='flex m-1 p-1 w-full h-full'>

            <div className='flex items-center justify-center p-2 border rounded-l-md flex-1'>
                <FieldViewWithInfo
                    value={spell.grade}
                    infoContent={<InfoContentWithTags castable={spell} />}
                    className="gap-1"
                    nameClassName='w-4xs'
                >
                    {spell.name}
                </FieldViewWithInfo>
            </div>

            <div className='flex items-center justify-center border rounded-r-md border-l-0'>
                <Button variant="ghost" className="h-full w-full p-0" onClick={() => addSpellToUsed(spell)} disabled={!canUseCastable(spell, usedSpells)}>
                    <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-l-none rounded-r-md' variant={getBadgeVariant(spell.castTime)}>
                        {cooldownIcon()}
                        <span>{spell.cooldown || battleIcon("scale-80")}</span>
                    </Badge>
                </Button>
            </div>

        </div>
    );
}