import { Character } from '@/domain/characters/Character';
import { setSearchQueryParam } from '@/common/global/httpUtils';
import axios from 'axios';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { CharacterSummary } from '@/persistence/charactersRepository';

const clientBase = axios.create
({
  baseURL: '/api',
  headers: 
  {
    Accept: 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

const characterPathSegment = '/characters';

const bffClient = 
{
    //Queries
    getCharacterById: async (id: string): Promise<Character> =>
    {
        const response = await clientBase.get<Character>(`${characterPathSegment}/${id}`);
        return response.data;
    },
    searchCharacters: async (search?: string): Promise<Character[]> =>
    {
        const url = new URL(characterPathSegment, window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await clientBase.get<Character[]>(finalUrl);
        return response.data;
    },
    getAllCharacters: async (): Promise<Character[]> =>
    {
        const response = await clientBase.get<Character[]>(characterPathSegment);
        return response.data;
    },
    searchCharactersSummary: async (search?: string): Promise<CharacterSummary[]> =>
    {
        const url = new URL(`${characterPathSegment}/headers`, window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await clientBase.get<CharacterSummary[]>(finalUrl);
        return response.data;
    },
    //Commands
    addCharacter: async (characterHeader: HeaderDto): Promise<string> =>
    {
        const response = await clientBase.post(characterPathSegment, characterHeader);
        return response.data;
    },
    deleteCharacterById: async (id: string) : Promise<void> =>
    {
        await clientBase.delete(`${characterPathSegment}/${id}`);
    },
    updateDetails: async (id: string, characterData: DetailsDto): Promise<void> =>
    {
        await clientBase.put(`${characterPathSegment}/${id}/details`, characterData);
    },
    updateCombat: async (id: string, characterData: CombatDto): Promise<void>  =>
    {
        await clientBase.put(`${characterPathSegment}/${id}/combat`, characterData);
    },
    updateStatistics: async (id: string, characterData: StatisticsDto): Promise<void> =>
    {
        await clientBase.put(`${characterPathSegment}/${id}/statistics`, characterData);
    },
    updateEquipment: async (id: string, characterData: EquipmentDto): Promise<void> =>
    {
        await clientBase.put(`${characterPathSegment}/${id}/equipment`, characterData);
    },
    updateTalents: async (id: string, talent: TalentsDto): Promise<void> =>
    {
        await clientBase.put(`${characterPathSegment}/${id}/talents`, talent);
    }
}

export default bffClient;