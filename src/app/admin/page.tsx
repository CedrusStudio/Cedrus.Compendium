"use client";

import Link from 'next/link';
import { useAdminStatus } from '@/common/hooks/useAdminStatus';
import { Button } from "@/ui/button";
import { homeIcon } from '@/common/icons';

export default function AdminPage()
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
          <h1 className="text-3xl font-bold">Panel administracyjny</h1>
          <p className="mt-3 text-sm text-muted-foreground">Ten obszar jest dostepny tylko dla kluczy administracyjnych.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl space-y-8">


      <div className="flex place-content-between place-items-center">

        <div>
          <h1 className="text-4xl font-bold">Panel administracyjny</h1>
          <p className="mt-2 text-muted-foreground">Zarządzaj globalnymi danymi współdzielonymi przez wszystkich użytkowników.</p>
        </div>

        <Button asChild variant="outline" size="icon">
          <Link href="/">{homeIcon("h-[1.2rem] w-[1.2rem]")}</Link>
      </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/admin/tags" className="rounded-lg border p-6 hover:bg-muted">
          <h2 className="text-2xl font-semibold">Zarządzanie tagami</h2>
          <p className="mt-2 text-sm text-muted-foreground">Przeglądaj, zmieniaj i usuwaj tagi dla encji kompendium i postaci.</p>
        </Link>

        <Link href="/admin/requirements" className="rounded-lg border p-6 hover:bg-muted">
          <h2 className="text-2xl font-semibold">Zarządzanie wymaganiami</h2>
          <p className="mt-2 text-sm text-muted-foreground">Przeglądaj, zmieniaj i usuwaj wymagania dla encji, które wspierają pole requirements.</p>
        </Link>
      </div>
    </div>
  );
}