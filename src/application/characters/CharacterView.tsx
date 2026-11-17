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
import CharacterLoading from '@/application/characters/CharacterLoading';

type CharacterViewProps = 
{
    tab?: CharacterTabs;
}

const defaultTab: CharacterTabs = "character";
const characterTabClassName = 'min-w-0 whitespace-normal text-center sm:flex-initial sm:whitespace-nowrap';

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

  if (isPending) return <CharacterLoading />;
  if (!character) return <NotFound subject={displayedText.character} />;

    const effectiveCharacter = applyActiveBuffProfile(character);

  return (
    <div data-slot="character-layout" className='grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]'>

        <aside aria-label="Statystyki postaci" className='hidden min-w-0 lg:block'>
                        <StatisticsView character={effectiveCharacter} />
        </aside>

        <Tabs 
            defaultValue={tab ?? defaultTab} 
            onValueChange={v => { if (isCharacterTab(v)) setActiveTab(v); }}
            className='flex min-w-0 w-full max-w-full flex-col'
        >
            <div className='min-w-0 max-w-full'>
                
                <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2'>

                    <TabsList className="grid h-auto w-full grid-cols-3 overflow-visible sm:inline-flex sm:w-fit sm:flex-wrap sm:justify-center">
                        <TabsTriggerCapitalized className={characterTabClassName} value="character" overrideValue={displayedText.character} />
                        <TabsTriggerCapitalized className={characterTabClassName} value="combat" overrideValue={displayedText.combat} />
                        <TabsTriggerCapitalized className={characterTabClassName} value="buffs" overrideValue={displayedText.buffs} />
                        <TabsTriggerCapitalized className={characterTabClassName} value="talents" overrideValue={displayedText.talents} />
                        <TabsTriggerCapitalized className={characterTabClassName} value="equipment" overrideValue={displayedText.equipment} />
                    </TabsList>

                    <div className='flex flex-wrap justify-center place-items-center gap-2 sm:gap-3'>
                        <FavoriteCharacterButton characterId={character.id} />
                        <MainCharacterButton characterId={character.id} />
                        <Button asChild variant="outline">
                            <Link href={createCharacterCopyHref(character.id)}>
                                <span className="first-letter:uppercase">{displayedText.duplicateCharacter}</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="icon" title="Karta do druku">
                            <Link href={`/characters/${character.id}/sheet`}>{printIcon}</Link>
                        </Button>

                        <DeleteButton id={character.id} isPending={isDeleting} deleteAction={deleteCharacter} />

                        <Button asChild variant="outline" size="icon">
                            <Link href={`/characters/${character.id}/edit?tab=${activeTab ?? defaultTab}`}>{editIcon}</Link>
                        </Button>
                    </div>
                </div>

                <Separator />
            </div>

            <div className='mt-1 min-w-0 max-w-full'>

                <TabsContent value="character">

                    <DetailsView character={character} />
                    <div className="my-4 lg:hidden">
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
