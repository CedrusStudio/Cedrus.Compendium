import { SearchEntityPayload, SearchByIdEntityPayload } from '@/common/global/SearchPayloads';
import client from '@/infrastructure/clients/baseClient';

const searchPathSegment = '/search';
const searchByIdPathSegment = '/search/:id';

const searchClient = 
{
    search: async <TResponse>(payload?: SearchEntityPayload): Promise<TResponse> =>
    {
        const response = await client.post<TResponse>(searchPathSegment, payload);
        return response.data;
    },    
    searchById: async <TResponse>(payload?: SearchByIdEntityPayload): Promise<TResponse> =>
    {
        const response = await client.post<TResponse>(searchByIdPathSegment, payload);
        return response.data;
    }
};

export default searchClient;
