"use client";

import { useParams } from 'next/navigation';
import { useCharacterById } from './useCharacterById';

export const useGetCharacterById = () =>
{
    const params = useParams();
    // Share the hydrated cache and wait for the access key before a client
    // fetch. An absent SSR prefetch must not invoke a browser-relative Axios
    // URL on the server (e.g. when rendering a private printable sheet).
    return useCharacterById(params.id ? String(params.id) : undefined);
};
