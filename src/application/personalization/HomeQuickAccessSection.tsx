"use client";

import Link from 'next/link';
import { usePersonalization } from '@/common/hooks/usePersonalization';
import { personalizationRouteLabels, resolveQuickLinkHref } from '@/application/personalization/personalizationUtils';

export default function HomeQuickAccessSection()
{
  const { hasApiKey, isLoaded, profile } = usePersonalization();

  if (!isLoaded)
  {
    return null;
  }

  const hasQuickAccess = Boolean(profile.mainCharacterId) || profile.favoriteCharacterIds.length > 0 || profile.quickLinks.length > 0;

  return (
    <div className="border-t pt-12">
      <h2 className="text-3xl font-bold mb-8 text-center">Szybki dostep</h2>

      {
        !hasApiKey ? (
          <div className="mx-auto max-w-3xl rounded-lg border p-6 text-center">
            <p className="text-lg font-medium">Ustaw API key, aby wlaczyc personalizacje.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Po konfiguracji zobaczysz tutaj szybkie linki, glowna postac i dostep do ulubionych.
            </p>
            <Link href="/personalization" className="mt-4 inline-flex rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Przejdz do personalizacji
            </Link>
          </div>
        ) : hasQuickAccess ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {
              profile.mainCharacterId && (
                <Link href={`/characters/${profile.mainCharacterId}`} className="rounded-lg border p-6 hover:bg-muted transition-colors">
                  <h3 className="text-xl font-semibold">Glowna postac</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Przejdz od razu do wybranej postaci.</p>
                </Link>
              )
            }

            {
              profile.favoriteCharacterIds.length > 0 && (
                <Link href="/characters/favorites" className="rounded-lg border p-6 hover:bg-muted transition-colors">
                  <h3 className="text-xl font-semibold">Ulubione postacie</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{profile.favoriteCharacterIds.length} zapisanych postaci.</p>
                </Link>
              )
            }

            {
              profile.quickLinks.map(quickLink => (
                <Link key={quickLink.id} href={resolveQuickLinkHref(quickLink)} className="rounded-lg border p-6 hover:bg-muted transition-colors">
                  <h3 className="text-xl font-semibold">{quickLink.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {quickLink.type === 'route' ? personalizationRouteLabels[quickLink.href] : 'Skrot do postaci'}
                  </p>
                </Link>
              ))
            }
          </div>
        ) : (
          <div className="mx-auto max-w-3xl rounded-lg border p-6 text-center">
            <p className="text-lg font-medium">Profil jest aktywny, ale nie ma jeszcze zapisanych skrotow.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Dodaj szybkie tagi, ulubione postacie lub linki na stronie personalizacji.
            </p>
            <Link href="/personalization" className="mt-4 inline-flex rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Otworz personalizacje
            </Link>
          </div>
        )
      }
    </div>
  );
}