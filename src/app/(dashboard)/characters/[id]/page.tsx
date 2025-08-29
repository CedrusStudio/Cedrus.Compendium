import CharacterCarousel from '@/components/character/CharacterCarousel';
import { characterRepository } from '@/persistence/characterRepository';
import { columns } from "@/app/(dashboard)/characters/[id]/columns"
import { DataTable } from "@/app/(dashboard)/characters/[id]/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from '@/components/ui/separator';
import EquipmentAccordion from '@/components/character/EquipmentAccordion';
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
      <h2 className='text-xl text-center font-semibold text-primary pt-2 pb-12 capitalize'>{character.name}</h2>

      <div className='grid grid-cols-1 md:grid-cols-3'>

        <div className='col-span-1'>
          <CharacterCarousel character={character} />
        </div>

        <Tabs defaultValue="talents" className='col-span-2 ml-15 grid grid-rows-15'>

          <div className='row-span-1'>
            <TabsList className='mb-4'>
              <TabsTrigger value="talents">Talents</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
            </TabsList>

            <Separator />
          </div>

          <div className='row-span-14 mx-4'>
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