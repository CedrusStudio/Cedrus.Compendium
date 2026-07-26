import { ModeDto, ModeWithEffectsDto } from '@/persistence/schemas/characters/combat/modeSchema';
import client from '@/infrastructure/clients/baseClient';

const stancePathSegment = '/stances';

const stancesClient =
{
    //Commands
    add: async (stance: ModeDto): Promise<string> =>
    {
        const response = await client.post(stancePathSegment, stance);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${stancePathSegment}/${id}`);
    },
    // Accepts the effects-bearing DTO so the compendium editor can persist
    // Combat Lab `effects`/`simulatable` (the common repository passes them
    // straight to Prisma, whose Stance model now has those columns).
    update: async (id: string, stanceData: ModeWithEffectsDto): Promise<void> =>
    {
        await client.put(`${stancePathSegment}/${id}`, stanceData);
    }
}

export default stancesClient;