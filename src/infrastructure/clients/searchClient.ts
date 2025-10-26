import { SearchEntityPayload } from '@/common/global/SearchPayload';
import client from '@/infrastructure/clients/baseClient';

const searchPathSegment = '/search';

const searchClient = 
{
    search: async <TResponse>(payload?: SearchEntityPayload): Promise<TResponse> =>
    {
        const response = await client.post<TResponse>(searchPathSegment, payload);
        return response.data;
    }
}

export default searchClient;