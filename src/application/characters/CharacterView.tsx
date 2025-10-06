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
} from "@/ui/alert-dialog"
import StatisticsView from '@/application/characters/statistics/StatisticsView';
import { columns } from "@/application/characters/talents/talentsColumns"
import { TalentsView } from "@/application/characters/talents/TalentsView"
import { Tabs, TabsContent, TabsList } from "@/ui/tabs"
import { Separator } from '@/ui/separator';
import EquipmentView from '@/application/characters/equipment/EquipmentView';
import CombatView from '@/application/characters/combat/CombatView';
import Link from 'next/link';
import { Button } from '@/ui/button';
import { TbEdit } from "react-icons/tb";
import TabsTriggerCapitalized from '@/ui/TabsTriggerCapitalized';
import { useState } from 'react';
import { CharacterTabs, isCharacterTab } from '@/common/tabsUtils';
import { useGetCharacterById } from './hooks/useGetCharacterById';
import { IoTrashOutline } from 'react-icons/io5';
import { useDeleteCharacterById } from "./hooks/useDeleteCharacterById";
import { namingConventions } from "@/domain/data/namingConventions";
import CharacterOverview from "@/application/characters/CharacterOverview";

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

  return (
    <div className='grid md:grid-cols-12'>

        <div className='col-span-12 lg:col-span-2'>
            <StatisticsView character={character} />
        </div>

        <Tabs 
            defaultValue={tab ?? defaultTab} 
            onValueChange={(v) => { if (isCharacterTab(v)) setActiveTab(v); }}
            className='col-span-8 lg:col-span-10 ml-15 grid grid-rows-15'
        >

            <div className='row-span-1'>
                <div className='flex flex-row justify-between items-center'>

                    <TabsList className='mb-4'>
                    <TabsTriggerCapitalized value="character" overrideValue="postać" />
                    <TabsTriggerCapitalized value="combat" overrideValue="walka" />
                    <TabsTriggerCapitalized value="talents" overrideValue="umiejętności" />
                    <TabsTriggerCapitalized value="equipment" overrideValue="ekwipunek" />
                    </TabsList>

                    <DeleteCharacterDialog id={character.id} activeTab={activeTab} isPending={isPending} deleteCharacter={deleteCharacter} />

                </div>

                <Separator />
            </div>

            <div className='row-span-14 mx-4'>
                <TabsContent value="character">
                    <CharacterOverview character={character} />
                </TabsContent>

                <TabsContent value="combat">
                    <CombatView character={character} />
                </TabsContent>

                <TabsContent value="talents">
                    <TalentsView columns={columns} data={character.talents ?? []} />
                </TabsContent>

                <TabsContent value="equipment">
                    <EquipmentView equipment={character.equipment} />
                </TabsContent>
            </div>

        </Tabs>
    </div>
  );
};

function DeleteCharacterDialog({ id, activeTab, isPending, deleteCharacter }: { id: string; activeTab: CharacterTabs | undefined; isPending: boolean; deleteCharacter: (id: string) => void })
{
    return (
        <div className='flex flex-row'>

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
                        <AlertDialogTitle> Czy na pewno chcesz to zrobić?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ta akcja jest nieodwracalna. Spowoduje to trwałe usunięcie twojej postaci z bazy danych na serwerze.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{namingConventions.cancel}</AlertDialogCancel>
                    <AlertDialogAction disabled={isPending} onClick={() => deleteCharacter(id) }>
                        {isPending ? namingConventions.deleting : namingConventions.delete}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button asChild variant="edit" size="icon" className='m-4'>
                <Link href={`/characters/${id}/edit?tab=${activeTab ?? defaultTab}`}><TbEdit /></Link>
            </Button>

        </div>
    );
}