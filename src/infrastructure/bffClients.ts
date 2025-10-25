import { Character } from '@/domain/characters/Character';
import { setSearchQueryParam, setSortQueryParam } from '@/common/global/httpUtils';
import axios from 'axios';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { CharacterSummary } from '@/persistence/charactersRepository';
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { ManeuverDto } from '@/persistence/schemas/characters/combat/maneuverSchema';

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

export const charactersClient = 
{
    //Queries
    getById: async (id: string): Promise<Character> =>
    {
        const response = await clientBase.get<Character>(`${characterPathSegment}/${id}`);
        return response.data;
    },
    search: async (search?: string): Promise<Character[]> =>
    {
        const url = new URL(characterPathSegment, window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await clientBase.get<Character[]>(finalUrl);
        return response.data;
    },
    getAll: async (): Promise<Character[]> =>
    {
        const response = await clientBase.get<Character[]>(characterPathSegment);
        return response.data;
    },
    searchSummaries: async (search?: string): Promise<CharacterSummary[]> =>
    {
        const url = new URL(`${characterPathSegment}/headers`, window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await clientBase.get<CharacterSummary[]>(finalUrl);
        return response.data;
    },
    //Commands
    add: async (characterHeader: HeaderDto): Promise<string> =>
    {
        const response = await clientBase.post(characterPathSegment, characterHeader);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
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

const maneuverPathSegment = '/maneuvers';

export const maneuversClient = 
{
    //Queries
    getById: async (id: string): Promise<Maneuver> =>
    {
        const response = await clientBase.get<Maneuver>(`${maneuverPathSegment}/${id}`);
        return response.data;
    },
    search: async (search?: string, sort?: string): Promise<Maneuver[]> =>
    {
        const url = new URL(maneuverPathSegment, window.location.origin);
        setSearchQueryParam(url, search);
        setSortQueryParam(url, sort);
        const finalUrl = url.pathname + url.search;
        const response = await clientBase.get<Maneuver[]>(finalUrl);
        return response.data;
    },
    //Commands
    add: async (maneuver: ManeuverDto): Promise<string> =>
    {
        const response = await clientBase.post(maneuverPathSegment, maneuver);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await clientBase.delete(`${maneuverPathSegment}/${id}`);
    },
    update: async (id: string, maneuverData: ManeuverDto): Promise<void> =>
    {
        await clientBase.put(`${maneuverPathSegment}/${id}`, maneuverData);
    },
}
