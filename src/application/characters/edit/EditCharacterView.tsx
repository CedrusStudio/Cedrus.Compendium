"use client";

import { Tabs, TabsContent, TabsList } from "@/ui/tabs"
import { Separator } from '@/ui/separator';
import Link from 'next/link';
import { Button } from '@/ui/button';
import TabsTriggerCapitalized from '@/ui/TabsTriggerCapitalized';
import { RiArrowGoBackFill } from "react-icons/ri";
import EditCharacterOverview from '@/application/characters/edit/EditCharacterOverview';
import EditCharacterStatistics from '@/application/characters/edit/statistics/EditCharacterStatistics';
import EditCharacterTalents from '@/application/characters/edit/talents/EditCharacterTalents';
import EditEquipmentView from '@/application/characters/edit/equipment/EditEquipmentView';
import { useState } from "react";
import { CharacterTabs, isCharacterTab } from "@/common/tabsUtils";
import EditCharacterCombat from "@/application/characters/edit/combat/EditCharacterCombat";
import { useGetCharacterById } from "@/application/characters/hooks/useGetCharacterById";
import { displayedText } from "@/presentation/translations";


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
        className='col-span-8 lg:col-span-10 grid'
    >

        <div className='row-span-1'>
            <div className='flex flex-row justify-between items-center'>
                <TabsList className='mb-4'>
                    <TabsTriggerCapitalized value="statistics" overrideValue={displayedText.statistics} />
                    <TabsTriggerCapitalized value="character" overrideValue={displayedText.character} />
                    <TabsTriggerCapitalized value="combat" overrideValue={displayedText.combat} />
                    <TabsTriggerCapitalized value="talents" overrideValue={displayedText.talents} />
                    <TabsTriggerCapitalized value="equipment" overrideValue={displayedText.equipment} />
                </TabsList>

                <Button asChild variant="default" size="icon" className='m-4'>
                    <Link href={`/characters/${character.id}?tab=${activeTab}`}><RiArrowGoBackFill /></Link>
                </Button>
            </div>    

            <Separator />
        </div>

        <div className='row-span-14 mx-4'>
            <TabsContent value="statistics">
                <EditCharacterStatistics character={character} />
            </TabsContent>

            <TabsContent value="character">
                <EditCharacterOverview character={character} />
            </TabsContent>

            <TabsContent value="combat">
                <EditCharacterCombat character={character} />
            </TabsContent>

            <TabsContent value="talents">
                <EditCharacterTalents character={character} />
            </TabsContent>

            <TabsContent value="equipment">
                <EditEquipmentView character={character} />
            </TabsContent>
        </div>

    </Tabs>
  );
};