"use client";

import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TabsTriggerCapitalized from '@/components/ui/TabsTriggerCapitalized';
import { RiArrowGoBackFill } from "react-icons/ri";
import CharacterDescriptionEdit from '@/components/character/edit/CharacterDescriptionEdit';
import CharacterStatisticsEdit from '@/components/character/edit/statistics/CharacterStatisticsEdit';
import CharacterTalentsEdit from '@/components/character/edit/talents/CharacterTalentsEdit';
import CharacterEquipmentEdit from '@/components/character/edit/equipment/CharacterEquipmentEdit';
import { useState } from "react";
import { CharacterTabs, isCharacterTab } from "@/utils/tabsUtils";
import EditCharacterCombat from "@/components/character/edit/combat/EditCharacterCombat";
import { useGetCharacterById } from "../hooks/useGetCharacterById";

type EditCharacterProps =
{
    tab: CharacterTabs;
}

export default function EditCharacterView({ tab }: EditCharacterProps)
{
  const { character } = useGetCharacterById();
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
                    <TabsTriggerCapitalized value="statistics" overrideValue='Statystyki' />
                    <TabsTriggerCapitalized value="character" overrideValue='Postać' />
                    <TabsTriggerCapitalized value="combat" overrideValue='Walka' />
                    <TabsTriggerCapitalized value="talents" overrideValue='Talenty' />
                    <TabsTriggerCapitalized value="equipment" overrideValue='Ekwipunek' />
                </TabsList>

                <Button asChild variant="default" size="icon" className='m-4'>
                    <Link href={`/characters/${character.id}?tab=${activeTab}`}><RiArrowGoBackFill /></Link>
                </Button>
            </div>    

            <Separator />
        </div>

        <div className='row-span-14 mx-4'>
            <TabsContent value="statistics">
                <CharacterStatisticsEdit character={character} />
            </TabsContent>

            <TabsContent value="character">
                <CharacterDescriptionEdit character={character} />
            </TabsContent>

            <TabsContent value="combat">
                <EditCharacterCombat character={character} />
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