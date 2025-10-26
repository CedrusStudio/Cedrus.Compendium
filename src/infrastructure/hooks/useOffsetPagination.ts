"use client";

import { useState } from 'react';
import { getClampedPage, getTotalPages } from '@/common/global/pagination';

export function useOffsetPagination(itemsTotalCount: number, pageSize: number) 
{
    const [page, setPage] = useState(1);
    
    const totalPages = getTotalPages(itemsTotalCount, pageSize);
    const clampedPage = getClampedPage(page, totalPages);
    
    const goTo = (p: number) => setPage(Math.min(Math.max(p, 1), totalPages));

    return { clampedPage, totalPages, goTo };
}