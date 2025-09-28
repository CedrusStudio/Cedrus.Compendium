import { Character } from '@/domain/Character';
import { setSearchQueryParam } from '@/persistence/cacheKeys';
import axios from 'axios';

const clientBase = axios.create
({
  baseURL: 'http:///localhost:3000/api',
  headers: 
  {
      Accept: 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

const bffClient = 
{
    searchCharacters: async (search?: string) =>
    {
        const url = new URL('/characters', window.location.origin);
        setSearchQueryParam(url, search);
        const finalUrl = url.pathname + url.search;
        const response = await clientBase.get<Character[]>(finalUrl);
        return response.data;
    }
}

export default bffClient;