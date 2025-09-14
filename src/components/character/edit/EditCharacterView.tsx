"use client";

import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TabsTriggerCapitalized from '@/components/ui/TabsTriggerCapitalized';
import { RiArrowGoBackFill } from "react-icons/ri";
import CharacterDescriptionEdit from '@/components/character/edit/CharacterDescriptionEdit';
import CharacterStatisticsEdit from '@/components/character/edit/CharacterStatisticsEdit';
import CharacterTalentsEdit from '@/components/character/edit/CharacterTalentsEdit';
import CharacterEquipmentEdit from '@/components/character/edit/CharacterEquipmentEdit';
import { Character } from "@/domain/Character";
import { useState } from "react";
import { CharacterTabs, isCharacterTab } from "@/utils/tabsUtils";

type EditCharacterProps =
{
    character: Character;
    tab: CharacterTabs;
}

export default function EditCharacterView({ character, tab }: EditCharacterProps)
{
  const [activeTab, setActiveTab] = useState<CharacterTabs>(tab ?? "character");
  
  return (
    <Tabs 
        defaultValue={tab} 
        onValueChange={(v) => { if (isCharacterTab(v)) setActiveTab(v); }}
        className='col-span-8 lg:col-span-10 grid grid-rows-15'
    >

        <div className='row-span-1'>
            <div className='flex flex-row justify-between items-center'>
                <TabsList className='mb-4'>
                    <TabsTriggerCapitalized value="character" overrideValue='Edit Character' />
                    <TabsTriggerCapitalized value="combat" overrideValue='Edit Combat' />
                    <TabsTriggerCapitalized value="talents" overrideValue='Edit Talents' />
                    <TabsTriggerCapitalized value="equipment" overrideValue='Edit Equipment' />
                </TabsList>

                <Button asChild variant="default" size="icon" className='m-4'>
                    <Link href={`/characters/${character.id}?tab=${activeTab}`}><RiArrowGoBackFill /></Link>
                </Button>
            </div>    

            <Separator />
        </div>

        <div className='row-span-14 mx-4'>
            <TabsContent value="character">
                <CharacterDescriptionEdit character={character} />
            </TabsContent>

            <TabsContent value="combat">
                <CharacterStatisticsEdit character={character} />
            </TabsContent>

            <TabsContent value="talents">
                <CharacterTalentsEdit character={character} />
            </TabsContent>

            <TabsContent value="equipment">
                <CharacterEquipmentEdit character={character} />
            </TabsContent>
        </div>

    </Tabs>
  );
};