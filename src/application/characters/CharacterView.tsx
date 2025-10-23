"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/alert-dialog";
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
import { IoTrashOutline } from 'react-icons/io5';
import { useDeleteCharacterById } from "@/application/characters/hooks/useDeleteCharacterById";
import { displayedText } from "@/presentation/translations";
import DetailsView from "@/application/characters/details/DetailsView";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/characterSlice";
import { editIcon } from "@/presentation/icons";

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
    dispatch(actions.setCharacterShortName({ id: character.id, shortName: character.shortName }));
  }, [character.id, character.shortName, dispatch]);               

  if (!character) return <div>Character not found</div>;

  return (
    <div className='flex flex-col lg:grid lg:grid-cols-12'>

        <div className='lg:col-span-2'>
            <StatisticsView character={character} />
        </div>

        <Tabs 
            defaultValue={tab ?? defaultTab} 
            onValueChange={(v) => { if (isCharacterTab(v)) setActiveTab(v); }}
            className='lg:col-span-10 lg:ml-6 flex flex-col lg:grid lg:grid-rows-15'
        >

            <div className='lg:row-span-1'>
                <div className='flex flex-col mt-4 sm:mt-0 sm:flex-row justify-between items-center'>

                    <TabsList>
                        <TabsTriggerCapitalized value="character" overrideValue={displayedText.character} />
                        <TabsTriggerCapitalized value="combat" overrideValue={displayedText.combat} />
                        <TabsTriggerCapitalized value="talents" overrideValue={displayedText.talents} />
                        <TabsTriggerCapitalized value="equipment" overrideValue={displayedText.equipment} />
                    </TabsList>

                    <div className='flex flex-row gap-3'>
                        <DeleteCharacterDialog id={character.id} isPending={isPending} deleteCharacter={deleteCharacter} />

                        <Button asChild variant="edit" size="icon" className='my-4'>
                            <Link href={`/characters/${character.id}/edit?tab=${activeTab ?? defaultTab}`}>{editIcon}</Link>
                        </Button>
                    </div>
                </div>

                <Separator />
            </div>

            <div className='mt-1 lg:row-span-14'>
                <TabsContent value="character">
                    <DetailsView character={character} />
                </TabsContent>

                <TabsContent value="combat" className="lg:-mt-7">
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

type DeleteCharacterDialogProps =
{
    id: string;
    isPending: boolean;
    deleteCharacter: (id: string) => void;
}

function DeleteCharacterDialog({ id, isPending, deleteCharacter }: DeleteCharacterDialogProps)
{
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="destructive" 
                    size='icon' 
                    className="my-4 hover:text-red-950"
                    disabled={isPending}
                >
                    <IoTrashOutline />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{displayedText.deleteConfirmation}</AlertDialogTitle>
                    <AlertDialogDescription>{displayedText.deleteConfirmationDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel className="capitalize">{displayedText.cancel}</AlertDialogCancel>
                <AlertDialogAction disabled={isPending} onClick={() => deleteCharacter(id) }>
                    {isPending ? displayedText.deleting : displayedText.delete}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}