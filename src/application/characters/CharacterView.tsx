"use client";

import StatisticsView from '@/application/characters/statistics/StatisticsView';
import { columns } from "@/application/characters/talents/talentsColumns";
import { TalentsTable } from "@/application/characters/talents/TalentsTable";
import { Tabs, TabsContent, TabsList } from "@/ui/tabs";
import { Separator } from '@/ui/separator';
import EquipmentView from '@/application/characters/equipment/EquipmentView';
import CombatView from '@/application/characters/combat/CombatView';
import Link from 'next/link';
import { Button } from '@/ui/button';
import TabsTriggerCapitalized from '@/ui/TabsTriggerCapitalized';
import { useEffect, useState } from 'react';
import { CharacterTabs, isCharacterTab } from '@/common/tabsUtils';
import { useGetCharacterById } from '@/application/characters/hooks/useGetCharacterById';
import { useDeleteCharacterById } from "@/application/characters/hooks/useDeleteCharacterById";
import { displayedText } from "@/common/translations";
import DetailsView from "@/application/characters/details/DetailsView";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/characterSlice";
import { editIcon } from "@/common/icons";
import DeleteButton from "@/common/components/buttons/DeleteButton";
import NotFound from '@/common/components/NotFound';
import FavoriteCharacterButton from '@/application/personalization/FavoriteCharacterButton';
import MainCharacterButton from '@/application/personalization/MainCharacterButton';
import { createCharacterCopyHref } from '@/application/characters/add/characterCopyRoute';

type CharacterViewProps = 
{
    tab?: CharacterTabs;
}

const defaultTab: CharacterTabs = "character";

export default function CharacterView({ tab }: CharacterViewProps)
{
  const { character } = useGetCharacterById();
  const [activeTab, setActiveTab] = useState<CharacterTabs>(tab ?? defaultTab);
  const { deleteCharacter, isPending } = useDeleteCharacterById();
  const dispatch = useDispatch();

  useEffect(() => 
  {
    if (!character?.id || !character?.shortName) return;
    dispatch(actions.setCharacterShortName({ id: character.id, shortName: character.shortName }));
  }, [character?.id, character?.shortName, dispatch]);               

  if (!character) return <NotFound subject={displayedText.character} />;

  return (
    <div className='flex flex-col-reverse gap-4 lg:grid lg:grid-cols-12'>

        <div className='hidden md:block md:col-span-2'>
            <StatisticsView character={character} />
        </div>

        <Tabs 
            defaultValue={tab ?? defaultTab} 
            onValueChange={v => { if (isCharacterTab(v)) setActiveTab(v); }}
            className='lg:col-span-10 lg:ml-6 flex flex-col lg:grid'
        >
            <div className='lg:row-span-1 -mt-4'>
                
                <div className='flex flex-col mt-4 sm:mt-0 sm:flex-row place-content-between place-items-center'>

                    <TabsList>
                        <TabsTriggerCapitalized value="character" overrideValue={displayedText.character} />
                        <TabsTriggerCapitalized value="combat" overrideValue={displayedText.combat} />
                        <TabsTriggerCapitalized value="talents" overrideValue={displayedText.talents} />
                        <TabsTriggerCapitalized value="equipment" overrideValue={displayedText.equipment} />
                    </TabsList>

                    <div className='flex flex-row place-items-center gap-3'>
                        <FavoriteCharacterButton characterId={character.id} />
                        <MainCharacterButton characterId={character.id} />
                        <Button asChild variant="outline" className='my-4'>
                            <Link href={createCharacterCopyHref(character.id)}>
                                <span className="first-letter:uppercase">{displayedText.duplicateCharacter}</span>
                            </Link>
                        </Button>
                        <DeleteButton id={character.id} isPending={isPending} deleteAction={deleteCharacter} />

                        <Button asChild variant="outline" size="icon" className='my-4'>
                            <Link href={`/characters/${character.id}/edit?tab=${activeTab ?? defaultTab}`}>{editIcon}</Link>
                        </Button>
                    </div>
                </div>

                <Separator />
            </div>

            <div className='mt-1 lg:row-span-14'>

                <TabsContent value="character">

                    <DetailsView character={character} />
                    <div className="my-4 md:hidden md:my-0">
                        <StatisticsView character={character} />
                    </div>
                    
                </TabsContent>

                <TabsContent value="combat">
                    <CombatView character={character} />
                </TabsContent>

                <TabsContent value="talents">
                    <TalentsTable columns={columns} data={character.talents ?? []} />
                </TabsContent>

                <TabsContent value="equipment">
                    <EquipmentView equipment={character.equipment} />
                </TabsContent>
            </div>

        </Tabs>
    </div>
  );
};
