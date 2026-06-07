import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { CopyCreateCharacterDto } from '@/persistence/schemas/characters/copyCharacterSchema';
import { BuffsDto } from '@/persistence/schemas/characters/buffs/buffsSchema';
import client from '@/infrastructure/clients/baseClient';

const characterPathSegment = '/characters';

const charactersClient = 
{
    //Queries
    getByIds: async (characterIds: string[]) =>
    {
        const response = await client.post(`${characterPathSegment}/by-ids`, { ids: characterIds });
        return response.data;
    },

    //Commands
    add: async (characterHeader: HeaderDto): Promise<string> =>
    {
        const response = await client.post(characterPathSegment, characterHeader);
        return response.data;
    },
    copyCreate: async (copyCreateData: CopyCreateCharacterDto): Promise<string> =>
    {
        const response = await client.post(`${characterPathSegment}/copy`, copyCreateData);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${characterPathSegment}/${id}`);
    },

    //Updates
    updateDetails: async (id: string, characterData: DetailsDto): Promise<void> =>
    {
        await client.put(`${characterPathSegment}/${id}/details`, characterData);
    },
    updateCombat: async (id: string, characterData: CombatDto): Promise<void>  =>
    {
        await client.put(`${characterPathSegment}/${id}/combat`, characterData);
    },
    updateStatistics: async (id: string, characterData: StatisticsDto): Promise<void> =>
    {
        await client.put(`${characterPathSegment}/${id}/statistics`, characterData);
    },
    updateEquipment: async (id: string, characterData: EquipmentDto): Promise<void> =>
    {
        await client.put(`${characterPathSegment}/${id}/equipment`, characterData);
    },
    updateTalents: async (id: string, talent: TalentsDto): Promise<void> =>
    {
        await client.put(`${characterPathSegment}/${id}/talents`, talent);
    },
    updateBuffs: async (id: string, buffs: BuffsDto): Promise<void> =>
    {
        await client.put(`${characterPathSegment}/${id}/buffs`, buffs);
    }
}

export default charactersClient;