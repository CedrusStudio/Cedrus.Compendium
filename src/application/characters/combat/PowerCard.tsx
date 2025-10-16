"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { RiResetLeftFill } from "react-icons/ri";
import { Badge } from '@/ui/badge';
import { GrNext } from "react-icons/gr";
import { displayedText } from "@/presentation/translations";
import { Power, Spell } from "@/domain/characters/combat/Power";
import FieldViewWithInfo from '@/common/components/fields/FieldViewWithInfo';
import { getBadgeVariant, getCastTimeColors } from '@/presentation/colors';
import { battleIcon, cooldownIcon, nextIcon, removePreviousIcon } from '@/presentation/icons';
import { canUseCastable, EndTurn } from '@/domain/characters/Castable';
import { useState } from 'react';

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
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{power.name}</CardTitle>
        </CardHeader>

        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'>
        {
            power.spells.map(spell => <SpellView key={spell.name} spell={spell} addSpellToUsed={addSpellToUsed} usedSpells={usedSpells} />)
        }

        <div className="grid grid-cols-13 items-center justify-center gap-3 mt-3 pt-4 border-t border-border/40 col-span-full">

            <Button variant="default" className='col-span-1' onClick={() => setUsedSpells([])}>
                <RiResetLeftFill />
            </Button>

            <p className="text-sm col-span-10">
                <span className='text-muted-foreground italic'>
                {
                    usedSpells.map((usedSpell, index) => 
                    {
                        if (usedSpell === "end") return (
                            <Badge key={index} variant="destructive" className='m-1' >
                                <GrNext />
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

        </CardContent>

    </Card>
  );
};

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
                    infoContent={<div> <span className='capitalize'>{displayedText.action}</span>  <span className={`${getCastTimeColors(spell.castTime).text}`}>{spell.castTime.toLowerCase()}</span>. {spell.description}</div>}
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