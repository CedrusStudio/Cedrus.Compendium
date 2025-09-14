import { getCharacter } from '@/persistence/characterRepository';
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TabsTriggerCapitalized from '@/components/ui/TabsTriggerCapitalized';
import { RiArrowGoBackFill } from "react-icons/ri";
import CharacterDescriptionEdit from '@/components/character/edit/CharacterDescriptionEdit';
import CharacterStatisticsEdit from '@/components/character/edit/CharacterStatisticsEdit';
import CharacterTalentsEdit from '@/components/character/edit/CharacterTalentsEdit';
import CharacterEquipmentEdit from '@/components/character/edit/CharacterEquipmentEdit';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { isEditCharacterTab } from '@/utils/tabsUtils';

type EditCharacterProps = 
{
    params: 
    {
        id: string;
    },
    searchParams: { [key: string]: string | string[] | undefined }
};

export default async function EditPage(input: EditCharacterProps)
{
  const params = await input.params;
  const character = await getCharacter(params.id);
  if (!character) throw Error("Character not found");

  const queryClient = new QueryClient();
  const searchParams = await input.searchParams;
  const tab = isEditCharacterTab(searchParams?.tab) ? searchParams.tab : "edit-character";

  return (
    <Tabs defaultValue={tab} className='col-span-8 lg:col-span-10 grid grid-rows-15'>

        <div className='row-span-1'>
            <div className='flex flex-row justify-between items-center'>
                <TabsList className='mb-4'>
                    <TabsTriggerCapitalized value="edit-character" overrideValue='Edit Character' />
                    <TabsTriggerCapitalized value="edit-combat" overrideValue='Edit Combat' />
                    <TabsTriggerCapitalized value="edit-talents" overrideValue='Edit Talents' />
                    <TabsTriggerCapitalized value="edit-equipment" overrideValue='Edit Equipment' />
                </TabsList>

                <Button asChild variant="default" size="icon" className='m-4'>
                    <Link href={`/characters/${character.id}?tab=${tab}`}><RiArrowGoBackFill /></Link>
                </Button>
            </div>    

            <Separator />
        </div>

        <div className='row-span-14 mx-4'>
            <TabsContent value="edit-character">
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <CharacterDescriptionEdit character={character} />
                </HydrationBoundary>
            </TabsContent>

            <TabsContent value="edit-combat">
                <CharacterStatisticsEdit character={character} />
            </TabsContent>

            <TabsContent value="edit-talents">
                <CharacterTalentsEdit character={character} />
            </TabsContent>

            <TabsContent value="edit-equipment">
                <CharacterEquipmentEdit character={character} />
            </TabsContent>
        </div>

    </Tabs>
  );
};
