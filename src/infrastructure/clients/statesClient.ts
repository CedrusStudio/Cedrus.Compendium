import { ModeDto, ModeWithEffectsDto } from '@/persistence/schemas/characters/combat/modeSchema';
import client from '@/infrastructure/clients/baseClient';

const statePathSegment = '/states';

const statesClient = 
{
    //Commands
    add: async (state: ModeDto): Promise<string> =>
    {
        const response = await client.post(statePathSegment, state);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${statePathSegment}/${id}`);
    },
    // Accepts the effects-bearing DTO, mirroring `stancesClient`: States are
    // authored in the compendium too, and the common repository passes
    // `effects`/`simulatable` straight through to Prisma.
    update: async (id: string, stateData: ModeWithEffectsDto): Promise<void> =>
    {
        await client.put(`${statePathSegment}/${id}`, stateData);
    }
}

export default statesClient;