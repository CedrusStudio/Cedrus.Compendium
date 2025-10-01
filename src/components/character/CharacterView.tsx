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
} from "@/components/ui/alert-dialog"
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
import { useState } from 'react';
import { CharacterTabs, isCharacterTab } from '@/utils/tabsUtils';
import { useGetCharacterById } from './hooks/useGetCharacterById';
import { IoTrashOutline } from 'react-icons/io5';
import { useDeleteCharacterById } from "./hooks/useDeleteCharacterById";

type CharacterViewProps = 
{
    tab?: CharacterTabs;
}

export default function CharacterView({ tab }: CharacterViewProps)
{
  const { character } = useGetCharacterById();
  const [activeTab, setActiveTab] = useState<CharacterTabs>(tab ?? "character");
  const { deleteCharacter, isPending } = useDeleteCharacterById();

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

                    <div className='flex flex-row'>

                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive" 
                                    size='icon' 
                                    className="my-4"
                                    disabled={isPending}
                                >
                                    <IoTrashOutline />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your character from the database at the server.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction disabled={isPending} onClick={() => deleteCharacter(character.id) }>
                                    {isPending ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button asChild variant="edit" size="icon" className='m-4'>
                            <Link href={`/characters/${character.id}/edit?tab=${activeTab ?? "character"}`}><TbEdit /></Link>
                        </Button>
                    </div>
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