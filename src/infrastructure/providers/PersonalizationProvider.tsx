'use client';

import type { PropsWithChildren } from 'react';
import { PersonalizationContext, useProfileSynchronization } from '@/common/hooks/usePersonalization';

export function PersonalizationProvider({ children }: PropsWithChildren)
{
  const profile = useProfileSynchronization();
  return <PersonalizationContext.Provider value={profile}>{children}</PersonalizationContext.Provider>;
}
