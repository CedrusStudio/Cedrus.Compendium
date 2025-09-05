import CharacterStatistics from '@/components/character/CharacterStatistics';
import { characterRepository } from '@/persistence/characterRepository';
import { columns } from "@/app/(dashboard)/characters/[id]/columns"
import { DataTable } from "@/app/(dashboard)/characters/[id]/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import EquipmentAccordion from '@/components/character/EquipmentAccordion';
import CharacterHeader from "@/components/character/CharacterHeader";
import CombatView from '@/components/character/combat/CombatView';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TbEdit } from "react-icons/tb";
import TabsTriggerCapitalized from '@/components/ui/TabsTriggerCapitalized';
// import seedDatabase from '@/persistence/seed';

type CharacterProps = 
{
    params: 
    {
        id: string;
    };
};

export default async function CharacterPage(input: CharacterProps)
{
  // seedDatabase();

  const params = await input.params;
  const character = characterRepository.get(params.id);
  if (!character) throw Error("Character not found");
  const data  = character.talents ?? [];

  return (
    <div>
      <div className='grid md:grid-cols-12'>

        <div className='col-span-12 lg:col-span-2'>
          <CharacterStatistics character={character} />
        </div>

        <Tabs defaultValue="character" className='col-span-8 lg:col-span-10 ml-15 grid grid-rows-15'>

          <div className='row-span-1'>
            <div className='flex flex-row justify-between items-center'>
              <TabsList className='mb-4'>
                <TabsTriggerCapitalized value="character" />
                <TabsTriggerCapitalized value="combat" />
                <TabsTriggerCapitalized value="talents" />
                <TabsTriggerCapitalized value="equipment" />
              </TabsList>

              <Button asChild variant="edit" size="icon" className='m-4'>
                <Link href={`/characters/${character.id}/edit`}><TbEdit /></Link>
              </Button>
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
              <DataTable columns={columns} data={data} />
            </TabsContent>

            <TabsContent value="equipment">
              <EquipmentAccordion equipment={character.equipment} />
            </TabsContent>
          </div>

        </Tabs>
      </div>
    </div>
  );
};