"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export function useQueryParamChange(path: string)
{
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  return (paramName: string, paramValue: string) => 
  {
    const params = new URLSearchParams(searchParams);
    if (paramValue) params.set(paramName, paramValue);
    else params.delete(paramName);
    replace(`${path}?${params}`);
  }
};

export function useSearchParamChangeWithDebounce(debounce: number = 300)
{
  const path = usePathname();
  const queryParamChange = useQueryParamChange(path);
  const searchParamsChange = (paramValue: string) => queryParamChange('search', paramValue);
  return useDebouncedCallback(searchParamsChange, debounce);
};

export function useParamsChange()
{
  const path = usePathname();
  const queryParamChange = useQueryParamChange(path);

  return {
    searchQueryParamChange: (paramValue: string) => queryParamChange('search', paramValue),
    sortQueryParamChange: (paramValue: string) => queryParamChange('sort', paramValue),
    sortDirectionQueryParamChange: (paramValue: string) => queryParamChange('sortDirection', paramValue),
    cursorQueryParamChange: (paramValue: string) => queryParamChange('cursor', paramValue)
  };
};