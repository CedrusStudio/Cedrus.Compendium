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
import { useIsMutating } from "@tanstack/react-query";
import SubmitButton from "@/common/components/form/SubmitButton";
import { characterEditFormIds, characterSaveKey } from "./editFormConstants";
import { useState } from "react";
import { CharacterTabs, isCharacterTab } from "@/common/tabsUtils";
import EditCharacterCombat from "@/application/characters/edit/combat/EditCharacterCombat";
import EditCharacterBuffs from "@/application/characters/edit/buffs/EditCharacterBuffs";
import { useGetCharacterById } from "@/application/characters/hooks/useGetCharacterById";
import { displayedText } from "@/common/translations";
import NotFound from "@/common/components/NotFound";
import LoadingSpinner from '@/common/components/LoadingSpinner';

type EditCharacterViewProps =
{
    tab: CharacterTabs;
}

export default function EditCharacterView({ tab }: EditCharacterViewProps)
{
  const { character, isPending } = useGetCharacterById();
  const [activeTab, setActiveTab] = useState<CharacterTabs>(tab ?? "character");

  if (isPending) return <LoadingSpinner />;
  if (!character) return <NotFound subject={displayedText.character} />;
  
  return (
    <Tabs 
        value={activeTab}
        onValueChange={v => { if (isCharacterTab(v)) setActiveTab(v); }}
        className='min-w-0 max-w-full flex flex-col justify-center items-stretch lg:justify-stretch lg:grid lg:col-span-10 -mt-4'
    >

        <div className='min-w-0 max-w-full lg:row-span-1'>
            <div className='flex min-w-0 items-center gap-2 px-1 py-2'>
                <TabsList className='min-w-0 shrink'>
                    <TabsTriggerCapitalized value="statistics" overrideValue={displayedText.statistics} />
                    <TabsTriggerCapitalized value="character" overrideValue={displayedText.character} />
                    <TabsTriggerCapitalized value="combat" overrideValue={displayedText.combat} />
                    <TabsTriggerCapitalized value="buffs" overrideValue={displayedText.buffs} />
                    <TabsTriggerCapitalized value="talents" overrideValue={displayedText.talents} />
                    <TabsTriggerCapitalized value="equipment" overrideValue={displayedText.equipment} />
                </TabsList>

                <CharacterEditorActions characterId={character.id} tab={activeTab} />
            </div>    

            <Separator />
        </div>

        <div className='min-w-0 row-span-14 mx-3 sm:mx-4'>
            <TabsContent value="statistics">
                <EditCharacterStatistics character={character} />
            </TabsContent>

            <TabsContent value="character">
                <EditDetailsView character={character} />
            </TabsContent>

            <TabsContent value="combat">
                <EditCharacterCombat character={character} />
            </TabsContent>

            <TabsContent value="buffs">
                <EditCharacterBuffs character={character} />
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

function CharacterEditorActions({ characterId, tab }: { characterId: string; tab: CharacterTabs }) {
  const saving = useIsMutating({ mutationKey: characterSaveKey(characterId, tab), exact: true }) > 0;

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <SubmitButton iconOnly formName={characterEditFormIds[tab]} isPending={saving} className="size-10 sm:size-9" />
      <Button asChild size="icon" className="size-10 sm:size-9">
        <Link href={`/characters/${characterId}?tab=${tab}`} aria-label={displayedText.back}>
          <RiArrowGoBackFill aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
