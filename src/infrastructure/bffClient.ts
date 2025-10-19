import { Character } from '@/domain/characters/Character';
import { setSearchQueryParam } from '@/common/global/httpUtils';
import axios from 'axios';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';

const clientBase = axios.create
({
  baseURL: 'http://localhost:3000/api',
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
    getCharacterById: async (id: string) =>
    {
        const response = await clientBase.get<Character>(`${characterPathSegment}/${id}`);
        return response.data;
    },
    searchCharacters: async (search?: string) =>
    {
        const url = new URL(characterPathSegment, window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await clientBase.get<Character[]>(finalUrl);
        return response.data;
    },
    //Commands
    addCharacter: async (characterHeader: HeaderDto) =>
    {
        const response = await clientBase.post(characterPathSegment, characterHeader);
        return response.data;
    },
    deleteCharacterById: async (id: string) =>
    {
        const response = await clientBase.delete(`${characterPathSegment}/${id}`);
        return response.data;
    },
    updateDetails: async (id: string, characterData: DetailsDto) =>
    {
        const response = await clientBase.put(`${characterPathSegment}/${id}/details`, characterData);
        return response.data;
    },
    updateCombat: async (id: string, characterData: CombatDto) =>
    {
        const response = await clientBase.put(`${characterPathSegment}/${id}/combat`, characterData);
        return response.data;
    },
    updateStatistics: async (id: string, characterData: StatisticsDto) =>
    {
        const response = await clientBase.put(`${characterPathSegment}/${id}/statistics`, characterData);
        return response.data;
    },
    updateEquipment: async (id: string, characterData: EquipmentDto) =>
    {
        const response = await clientBase.put(`${characterPathSegment}/${id}/equipment`, characterData);
        return response.data;
    },
    updateTalents: async (id: string, talent: TalentsDto) =>
    {
        const response = await clientBase.put(`${characterPathSegment}/${id}/talents`, talent);
        return response.data;
    }
}

export default bffClient;