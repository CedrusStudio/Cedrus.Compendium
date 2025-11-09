"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchMountsKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Mount } from '@/domain/characters/equipment/Mount';
import { createMountKeysetQuery } from '@/infrastructure/searchQueries/equipment/mounts/createMountKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchMounts = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const mountsQuery = createMountKeysetQuery(search);
    const queryKey = createKeysetSearchMountsKey(search);

    const { data = [] } = useSuspenseQuery<Mount[]>
    ({
        queryKey,
        queryFn: () => client.search(mountsQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (mountsQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { mounts: data, initialCursor };
};
