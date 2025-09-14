"use client";

import CharacterStatistics from '@/components/character/CharacterStatistics';
import { columns } from "@/components/character/talentsColumns"
import { TalentsTable } from "@/components/character/TalentsTable"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import EquipmentAccordion from '@/components/character/EquipmentAccordion';
import CharacterHeader from "@/components/character/CharacterHeader";
import CombatView from '@/components/character/combat/CombatView';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TbEdit } from "react-icons/tb";
import TabsTriggerCapitalized from '@/components/ui/TabsTriggerCapitalized';
import { Character } from '@/domain/Character';
import { useState } from 'react';
import { CharacterTabs, isCharacterTab } from '@/utils/tabsUtils';

type CharacterViewProps = 
{
    character: Character;
    tab?: CharacterTabs;
}

export default function CharacterView({ character, tab }: CharacterViewProps)
{
  const [activeTab, setActiveTab] = useState<CharacterTabs>(tab ?? "character");

  return (
    <div className='grid md:grid-cols-12'>

        <div className='col-span-12 lg:col-span-2'>
            <CharacterStatistics character={character} />
        </div>

        <Tabs 
            defaultValue={tab ?? "character"} 
            onValueChange={(v) => { if (isCharacterTab(v)) setActiveTab(v); }}
            className='col-span-8 lg:col-span-10 ml-15 grid grid-rows-15'>

            <div className='row-span-1'>
                <div className='flex flex-row justify-between items-center'>

                    <TabsList className='mb-4'>
                    <TabsTriggerCapitalized value="character" />
                    <TabsTriggerCapitalized value="combat" />
                    <TabsTriggerCapitalized value="talents" />
                    <TabsTriggerCapitalized value="equipment" />
                    </TabsList>

                    <Button asChild variant="edit" size="icon" className='m-4'>
                        <Link href={`/characters/${character.id}/edit?tab=${activeTab ?? "character"}`}><TbEdit /></Link>
                    </Button>
                </div>

                <Separator />
            </div>

            <div className='row-span-14 mx-4'>
                <TabsContent value="character">
                    <CharacterHeader character={character} />
                </TabsContent>

                <TabsContent value="combat">
                    <CombatView character={character} />
                </TabsContent>

                <TabsContent value="talents">
                    <TalentsTable columns={columns} data={character.talents ?? []} />
                </TabsContent>

                <TabsContent value="equipment">
                    <EquipmentAccordion equipment={character.equipment} />
                </TabsContent>
            </div>

        </Tabs>
    </div>
  );
};