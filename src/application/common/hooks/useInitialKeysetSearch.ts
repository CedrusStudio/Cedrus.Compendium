"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getSearchQueryParam } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { Entity } from '@/domain/Entity';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';

type UseInitialKeysetSearchConfig = 
{
    createQueryKey: (search: string | undefined) => readonly (string | number | undefined)[];
    createQuery: (search: string | undefined) => SearchEntityPayload;
};

type UseInitialKeysetSearchResult<TEntity> = 
{
    data: TEntity[];
    initialCursor: string | undefined;
};

export function useInitialKeysetSearch<TEntity extends Entity>({ createQueryKey, createQuery }: UseInitialKeysetSearchConfig)
    : UseInitialKeysetSearchResult<TEntity>
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const query = createQuery(search);
    const queryKey = createQueryKey(search);

    const { data = [] } = useSuspenseQuery<TEntity[]>
    ({
        queryKey,
        queryFn: () => client.search(query),
        staleTime: 5_000,
        refetchOnWindowFocus: true
    });

    const initialCursor = data.length === (query.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) 
        ? data[data.length - 1]?.id 
        : undefined;

    return { 
        data, 
        initialCursor 
    };
}
