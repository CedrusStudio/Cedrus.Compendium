"use client";

import { Tabs, TabsContent, TabsList } from "@/ui/tabs"
import { Separator } from '@/ui/separator';
import Link from 'next/link';
import { Button } from '@/ui/button';
import TabsTriggerCapitalized from '@/ui/TabsTriggerCapitalized';
import { RiArrowGoBackFill } from "react-icons/ri";
import EditDetailsView from '@/application/characters/edit/details/EditDetailsView';
import EditCharacterStatistics from '@/application/characters/edit/statistics/EditCharacterStatistics';
import EditCharacterTalents from '@/application/characters/edit/talents/EditCharacterTalents';
import EditEquipmentView from '@/application/characters/edit/equipment/EditEquipmentView';
import { useState } from "react";
import { CharacterTabs, isCharacterTab } from "@/common/tabsUtils";
import EditCharacterCombat from "@/application/characters/edit/combat/EditCharacterCombat";
import { useGetCharacterById } from "@/application/characters/hooks/useGetCharacterById";
import { displayedText } from "@/presentation/translations";
import NotFound from "@/common/components/NotFound";

type EditCharacterViewProps =
{
    tab: CharacterTabs;
}

export default function EditCharacterView({ tab }: EditCharacterViewProps)
{
  const { character } = useGetCharacterById();
  const [activeTab, setActiveTab] = useState<CharacterTabs>(tab ?? "character");

  if (!character) return <NotFound subject={displayedText.character} />;
  
  return (
    <Tabs 
        defaultValue={tab} 
        onValueChange={(v) => { if (isCharacterTab(v)) setActiveTab(v); }}
        className='flex flex-col justify-center items-center lg:justify-stretch lg:grid lg:col-span-10 -mt-4'
    >

        <div className='lg:row-span-1'>
            <div className='flex flex-row flex-wrap justify-between items-center'>
                <TabsList className='flex scale-95 m-1 sm:m-0 sm:scale-100'>
                    <TabsTriggerCapitalized value="statistics" overrideValue={displayedText.statistics} />
                    <TabsTriggerCapitalized value="character" overrideValue={displayedText.character} />
                    <TabsTriggerCapitalized value="combat" overrideValue={displayedText.combat} />
                    <TabsTriggerCapitalized value="talents" overrideValue={displayedText.talents} />
                    <TabsTriggerCapitalized value="equipment" overrideValue={displayedText.equipment} />
                </TabsList>

                <Button asChild variant="default" size="icon" className='m-2 flex-1 lg:m-4 lg:flex-initial'>
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
                <EditDetailsView character={character} />
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