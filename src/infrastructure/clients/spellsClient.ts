import { SpellDto } from '@/persistence/schemas/characters/combat/powerSchema';
import client from '@/infrastructure/clients/baseClient';

const spellPathSegment = '/spells';

const spellsClient = 
{
    //Commands
    add: async (spell: SpellDto): Promise<string> =>
    {
        const response = await client.post(spellPathSegment, spell);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${spellPathSegment}/${id}`);
    },
    update: async (id: string, spellData: SpellDto): Promise<void> =>
    {
        await client.put(`${spellPathSegment}/${id}`, spellData);
    }
}

export default spellsClient;