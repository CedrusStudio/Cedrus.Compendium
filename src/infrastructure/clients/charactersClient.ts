import { Character } from '@/domain/characters/Character';
import { setSearchQueryParam, } from '@/common/global/httpUtils';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { CharacterSummary } from '@/persistence/charactersRepository';
import client from '@/infrastructure/clients/baseClient';

const characterPathSegment = '/characters';

const charactersClient = 
{
    //Queries
    getById: async (id: string): Promise<Character> =>
    {
        const response = await client.get<Character>(`${characterPathSegment}/${id}`);
        return response.data;
    },
    search: async (search?: string): Promise<Character[]> =>
    {
        const url = new URL(characterPathSegment, window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await client.get<Character[]>(finalUrl);
        return response.data;
    },
    searchSummaries: async (search?: string): Promise<CharacterSummary[]> =>
    {
        const url = new URL(`${characterPathSegment}/headers`, window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await client.get<CharacterSummary[]>(finalUrl);
        return response.data;
    },
    
    //Commands
    add: async (characterHeader: HeaderDto): Promise<string> =>
    {
        const response = await client.post(characterPathSegment, characterHeader);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${characterPathSegment}/${id}`);
    },
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
    }
}

export default charactersClient;