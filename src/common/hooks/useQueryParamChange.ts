"use client";

import { useRouter, useSearchParams } from "next/navigation";

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

export function useQuerySearchAndSortParamsChange(path: string)
{
  const queryParamChange = useQueryParamChange(path);

  return {
    searchQueryParamChange: (paramValue: string) => queryParamChange('search', paramValue),
    sortQueryParamChange: (paramValue: string) => queryParamChange('sort', paramValue)
  };
};