import CharacterCarousel from '@/components/character/CharacterCarousel';
import { characterRepository } from '@/persistence/characterRepository';
import { columns } from "@/app/(dashboard)/characters/[id]/columns"
import { DataTable } from "@/app/(dashboard)/characters/[id]/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import EquipmentAccordion from '@/components/character/EquipmentAccordion';
// import seedDatabase from '@/persistence/seed';
import CharacterHeader from "@/components/character/CharacterHeader";
import CombatView from '@/components/character/combat/CombatView';

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

        <div className='col-span-4 lg:col-span-2'>
          <CharacterCarousel character={character} />
        </div>

        <Tabs defaultValue="character" className='col-span-8 lg:col-span-10 ml-15 grid grid-rows-15'>

          <div className='row-span-1'>
            <TabsList className='mb-4'>
              <TabsTrigger value="character">Character</TabsTrigger>
              <TabsTrigger value="combat">Combat</TabsTrigger>
              <TabsTrigger value="talents">Talents</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
            </TabsList>

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
