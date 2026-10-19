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
import { editIcon, printIcon } from "@/common/icons";
import DeleteButton from "@/common/components/buttons/DeleteButton";
import NotFound from '@/common/components/NotFound';
import FavoriteCharacterButton from '@/application/personalization/FavoriteCharacterButton';
import MainCharacterButton from '@/application/personalization/MainCharacterButton';
import { createCharacterCopyHref } from '@/application/characters/add/characterCopyRoute';
import CharacterBuffsView from '@/application/characters/buffs/CharacterBuffsView';
import { applyActiveBuffProfile } from '@/domain/characters/buffs/applyBuffProfile';
import LoadingSpinner from '@/common/components/LoadingSpinner';

type CharacterViewProps = 
{
    tab?: CharacterTabs;
}

const defaultTab: CharacterTabs = "character";
const characterTabClassName = 'flex-[1_0_30%] sm:flex-initial';

export default function CharacterView({ tab }: CharacterViewProps)
{
  const { character, isPending } = useGetCharacterById();
  const [activeTab, setActiveTab] = useState<CharacterTabs>(tab ?? defaultTab);
    const [selectedStanceId, setSelectedStanceId] = useState<string | undefined>(undefined);
    const [selectedStateId, setSelectedStateId] = useState<string | undefined>(undefined);
  const { deleteCharacter, isPending: isDeleting } = useDeleteCharacterById();
  const dispatch = useDispatch();

  useEffect(() => 
  {
    if (!character?.id || !character?.shortName) return;
    dispatch(actions.setCharacterShortName({ id: character.id, shortName: character.shortName }));
  }, [character?.id, character?.shortName, dispatch]);               

  if (isPending) return <LoadingSpinner />;
  if (!character) return <NotFound subject={displayedText.character} />;

    const effectiveCharacter = applyActiveBuffProfile(character);

  return (
    <div className='min-w-0 flex flex-col-reverse gap-4 lg:grid lg:grid-cols-12'>

        <div className='hidden md:block md:col-span-2'>
                        <StatisticsView character={effectiveCharacter} />
        </div>

        <Tabs 
            defaultValue={tab ?? defaultTab} 
            onValueChange={v => { if (isCharacterTab(v)) setActiveTab(v); }}
            className='min-w-0 max-w-full lg:col-span-10 lg:ml-6 flex flex-col lg:grid'
        >
            <div className='min-w-0 max-w-full lg:row-span-1 -mt-4'>
                
                <div className='flex flex-col mt-4 sm:mt-0 sm:flex-row place-content-between place-items-center'>

                    <TabsList className="h-auto w-full flex-wrap justify-center overflow-visible sm:w-fit">
                        <TabsTriggerCapitalized className={characterTabClassName} value="character" overrideValue={displayedText.character} />
                        <TabsTriggerCapitalized className={characterTabClassName} value="combat" overrideValue={displayedText.combat} />
                        <TabsTriggerCapitalized className={characterTabClassName} value="buffs" overrideValue={displayedText.buffs} />
                        <TabsTriggerCapitalized className={characterTabClassName} value="talents" overrideValue={displayedText.talents} />
                        <TabsTriggerCapitalized className={characterTabClassName} value="equipment" overrideValue={displayedText.equipment} />
                    </TabsList>

                    <div className='flex flex-wrap justify-center place-items-center gap-2 sm:gap-3'>
                        <FavoriteCharacterButton characterId={character.id} />
                        <MainCharacterButton characterId={character.id} />
                        <Button asChild variant="outline" className='my-4'>
                            <Link href={createCharacterCopyHref(character.id)}>
                                <span className="first-letter:uppercase">{displayedText.duplicateCharacter}</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="icon" className='my-4' title="Karta do druku">
                            <Link href={`/characters/${character.id}/sheet`}>{printIcon}</Link>
                        </Button>

                        <DeleteButton id={character.id} isPending={isDeleting} deleteAction={deleteCharacter} />

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
                        <StatisticsView character={effectiveCharacter} />
                    </div>
                    
                </TabsContent>

                <TabsContent value="combat">
                    <CombatView
                      character={effectiveCharacter}
                      selectedStanceId={selectedStanceId}
                      selectedStateId={selectedStateId}
                      onSelectedStanceIdChange={setSelectedStanceId}
                      onSelectedStateIdChange={setSelectedStateId}
                    />
                </TabsContent>

                <TabsContent value="buffs">
                                        <CharacterBuffsView
                                            character={character}
                                            selectedStanceId={selectedStanceId}
                                            selectedStateId={selectedStateId}
                                        />
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
