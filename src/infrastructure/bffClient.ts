import { Character, Talent } from '@/domain/characters/Character';
import { setSearchQueryParam } from '@/common/global/httpUtils';
import axios from 'axios';

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
    searchCharacters: async (search?: string) =>
    {
        const url = new URL(characterPathSegment, window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await clientBase.get<Character[]>(finalUrl);
        return response.data;
    },
    getCharacterById: async (id: string) =>
    {
        const response = await clientBase.get<Character>(`${characterPathSegment}/${id}`);
        return response.data;
    },
    deleteCharacterById: async (id: string) =>
    {
        const response = await clientBase.delete(`${characterPathSegment}/${id}`);
        return response.data;
    },
    upsertCharacter: async (id: string, characterData: Character) =>
    {
        const response = await clientBase.put(`${characterPathSegment}/${id}`, characterData);
        return response.data;
    },
    addTalent: async (id: string, talent: Talent) =>
    {
        const response = await clientBase.post(`${characterPathSegment}/${id}/talents`, talent);
        return response.data;
    }
}

export default bffClient;