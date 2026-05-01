"use client";

import { useQuery } from '@tanstack/react-query';
import { useApiKey } from '@/common/hooks/useApiKey';
import adminClient from '@/infrastructure/clients/adminClient';

export function useAdminStatus()
{
  const { hasApiKey, isLoaded } = useApiKey();

  const { data, isLoading } = useQuery({
    queryKey: ['adminCapabilities', hasApiKey],
    queryFn: adminClient.getCapabilities,
    enabled: isLoaded && hasApiKey,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isLoaded,
    isCheckingAdmin: isLoaded && hasApiKey ? isLoading : false,
    isAdmin: hasApiKey ? Boolean(data?.isAdmin) : false,
  };
}