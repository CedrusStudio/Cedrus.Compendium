"use client";

import { useAdminStatus } from '@/common/hooks/useAdminStatus';
import StructuredRequirementsManager from '@/app/admin/requirements/StructuredRequirementsManager';

export default function RequirementsManagementPage()
{
  const { isAdmin, isCheckingAdmin, isLoaded } = useAdminStatus();

  if (!isLoaded || isCheckingAdmin)
  {
    return null;
  }

  if (!isAdmin)
  {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="rounded-lg border p-6 text-center">
          <h1 className="text-3xl font-bold">Zarzadzanie wymaganiami</h1>
          <p className="mt-3 text-sm text-muted-foreground">Ta sekcja jest dostepna tylko dla administratorow.</p>
        </div>
      </div>
    );
  }

  return <StructuredRequirementsManager />;
}
