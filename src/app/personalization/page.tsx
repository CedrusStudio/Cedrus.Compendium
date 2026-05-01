"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ulid } from 'ulid';
import { ApiKeySettings } from '@/common/components/ApiKeySettings';
import { usePersonalization } from '@/common/hooks/usePersonalization';
import { useFavoriteCharacters } from '@/application/personalization/useFavoriteCharacters';
import { personalizationContextLabels, personalizationRouteLabels, resolveQuickLinkHref } from '@/application/personalization/personalizationUtils';
import { personalizationContexts, quickLinkRoutes, QuickLinkRoute } from '@/persistence/slices/personalizationSlice';
import { bestiaryColumnPreferenceKeys, resolveBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';
import { displayedText } from '@/common/translations';
import { homeIcon } from '@/common/icons';
import { Button } from "@/ui/button";

export default function PersonalizationPage()
{
  const { apiKey, hasApiKey, isLoaded, profile, setUserName, setBestiaryColumnVisibility, clearBestiaryColumnVisibility, addQuickTag, removeQuickTag, removeFavoriteCharacter, setMainCharacter, addQuickLink, removeQuickLink } = usePersonalization();
  const { favoriteCharacters, isLoading } = useFavoriteCharacters();
  const [selectedContext, setSelectedContext] = useState(personalizationContexts[0]);
  const [quickTagInput, setQuickTagInput] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<QuickLinkRoute>('/characters/favorites');
  const [quickLinkLabel, setQuickLinkLabel] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [bestiaryColumnVisibilityDraft, setBestiaryColumnVisibilityDraft] = useState(resolveBestiaryColumnVisibility());

  const favoriteCharacterOptions = useMemo(
    () => favoriteCharacters.map(character => ({ id: character.id, label: character.name })),
    [favoriteCharacters],
  );

  useEffect(() => 
  {
    setUserNameInput(profile.userName ?? '');
  }, [profile.userName]);

  useEffect(() => 
  {
    setBestiaryColumnVisibilityDraft(resolveBestiaryColumnVisibility(profile.bestiaryColumnVisibility));
  }, [profile.bestiaryColumnVisibility]);

  if (!isLoaded)
  {
    return null;
  }

  const handleAddQuickTag = () =>
  {
    addQuickTag(selectedContext, quickTagInput);
    setQuickTagInput('');
  };

  const handleAddQuickLink = () =>
  {
    const label = quickLinkLabel.trim();
    if (!label) return;

    addQuickLink({
      id: ulid(),
      label,
      type: 'route',
      href: selectedRoute,
    });
    setQuickLinkLabel('');
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Personalizacja</h1>
          <p className="mt-2 text-muted-foreground">
            Zarzadzaj szybkim dostepem, ulubionymi postaciami i zapisanymi tagami dla aktywnego API key.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
            <ApiKeySettings />
            <Button asChild variant="outline" size="icon">
                <Link href="/">{homeIcon("h-[1.2rem] w-[1.2rem]")}</Link>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Nazwa uzytkownika</p>
          <p className="mt-2 font-medium break-all">{profile.userName ?? 'brak'}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Aktywny API key</p>
          <p className="mt-2 font-medium break-all">{apiKey ?? 'brak'}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Ulubione postacie</p>
          <p className="mt-2 text-2xl font-semibold">{profile.favoriteCharacterIds.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Szybkie linki</p>
          <p className="mt-2 text-2xl font-semibold">{profile.quickLinks.length}</p>
        </div>
      </div>

      {
        !hasApiKey ? (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-lg font-medium">Najpierw ustaw API key.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Profile personalizacji sa rozdzielone per API key, wiec bez klucza nie da sie zapisac preferencji.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Profil uzytkownika</h2>
                <p className="text-sm text-muted-foreground">Powiaz czytelna nazwe z aktywnym API key bez zmiany samego klucza.</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  className="rounded-md border bg-background px-3 py-2 md:flex-1"
                  value={userNameInput}
                  onChange={event => setUserNameInput(event.target.value)}
                  placeholder="Nazwa uzytkownika dla tego API key"
                />

                <button type="button" className="rounded-md border px-4 py-2 font-medium hover:bg-muted" onClick={() => setUserName(userNameInput)}>
                  Zapisz nazwe
                </button>

                <button
                  type="button"
                  className="rounded-md border px-4 py-2 font-medium hover:bg-muted"
                  onClick={() => {
                    setUserName(undefined);
                    setUserNameInput('');
                  }}
                >
                  Wyczysc nazwe
                </button>
              </div>
            </section>

            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Szybkie tagi</h2>
                <p className="text-sm text-muted-foreground">Mozesz zapisac maksymalnie 5 tagow na kontekst.</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <select className="rounded-md border bg-background px-3 py-2" value={selectedContext} onChange={event => setSelectedContext(event.target.value as typeof selectedContext)}>
                  {
                    personalizationContexts.map(context => (
                      <option key={context} value={context}>{personalizationContextLabels[context]}</option>
                    ))
                  }
                </select>

                <input
                  className="rounded-md border bg-background px-3 py-2 md:flex-1"
                  value={quickTagInput}
                  onChange={event => setQuickTagInput(event.target.value)}
                  placeholder="Dodaj szybki tag"
                />

                <button type="button" className="rounded-md border px-4 py-2 font-medium hover:bg-muted" onClick={handleAddQuickTag}>
                  Dodaj tag
                </button>
              </div>

              <div className="space-y-3">
                {
                  personalizationContexts.map(context => {
                    const quickTags = profile.quickTagsByContext[context] ?? [];

                    return (
                      <div key={context}>
                        <p className="text-sm font-medium">{personalizationContextLabels[context]}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {
                            quickTags.length > 0 ? quickTags.map(tag => (
                              <button
                                key={`${context}-${tag}`}
                                type="button"
                                className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                                onClick={() => removeQuickTag(context, tag)}
                              >
                                {tag}
                              </button>
                            )) : <span className="text-sm text-muted-foreground">Brak zapisanych tagow.</span>
                          }
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </section>

            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Kolumny bestiariusza</h2>
                <p className="text-sm text-muted-foreground">
                  {profile.bestiaryColumnVisibility
                    ? 'Dla tego profilu zapisano niestandardowy zestaw kolumn.'
                    : 'Jesli nic nie zapiszesz, bestiariusz uzyje domyslnego zestawu kolumn.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {
                  bestiaryColumnPreferenceKeys.map(columnKey => (
                    <label key={columnKey} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={bestiaryColumnVisibilityDraft[columnKey]}
                        onChange={event => setBestiaryColumnVisibilityDraft(current => ({
                          ...current,
                          [columnKey]: event.target.checked,
                        }))}
                      />
                      <span className="capitalize">{displayedText[columnKey as keyof typeof displayedText]}</span>
                    </label>
                  ))
                }
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  className="rounded-md border px-4 py-2 font-medium hover:bg-muted"
                  onClick={() => setBestiaryColumnVisibility(bestiaryColumnVisibilityDraft)}
                >
                  Zapisz kolumny bestiariusza
                </button>

                <button
                  type="button"
                  className="rounded-md border px-4 py-2 font-medium hover:bg-muted"
                  onClick={() => {
                    clearBestiaryColumnVisibility();
                    setBestiaryColumnVisibilityDraft(resolveBestiaryColumnVisibility());
                  }}
                >
                  Przywroc domyslne kolumny
                </button>
              </div>
            </section>

            <section className="rounded-lg border p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Ulubione postacie</h2>
                  <p className="text-sm text-muted-foreground">Dodawaj je z listy postaci albo z widoku pojedynczej postaci.</p>
                </div>

                <Link href="/characters/favorites" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                  Otworz ulubione
                </Link>
              </div>

              {
                isLoading ? <p className="text-sm text-muted-foreground">Ladowanie postaci...</p> : (
                  <div className="space-y-3">
                    {
                      favoriteCharacterOptions.length > 0 ? favoriteCharacterOptions.map(character => (
                        <div key={character.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                          <Link href={`/characters/${character.id}`} className="font-medium hover:underline">{character.label}</Link>
                          <button type="button" className="rounded-md border px-3 py-1 text-sm hover:bg-muted" onClick={() => removeFavoriteCharacter(character.id)}>
                            Usun
                          </button>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">Brak ulubionych postaci dla tego profilu.</p>
                    }
                  </div>
                )
              }

              <div className="space-y-2">
                <label className="text-sm font-medium">Glowna postac</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={profile.mainCharacterId ?? ''}
                  onChange={event => setMainCharacter(event.target.value || undefined)}
                >
                  <option value="">Brak glownej postaci</option>
                  {
                    favoriteCharacterOptions.map(character => (
                      <option key={character.id} value={character.id}>{character.label}</option>
                    ))
                  }
                </select>
              </div>
            </section>

            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Szybkie linki</h2>
                <p className="text-sm text-muted-foreground">Te skroty pojawia sie na stronie glownej tylko dla aktywnego profilu.</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  className="rounded-md border bg-background px-3 py-2 md:flex-1"
                  value={quickLinkLabel}
                  onChange={event => setQuickLinkLabel(event.target.value)}
                  placeholder="Nazwa linku"
                />

                <select className="rounded-md border bg-background px-3 py-2" value={selectedRoute} onChange={event => setSelectedRoute(event.target.value as QuickLinkRoute)}>
                  {
                    quickLinkRoutes.map(route => (
                      <option key={route} value={route}>{personalizationRouteLabels[route]}</option>
                    ))
                  }
                </select>

                <button type="button" className="rounded-md border px-4 py-2 font-medium hover:bg-muted" onClick={handleAddQuickLink}>
                  Dodaj link
                </button>
              </div>

              <div className="space-y-3">
                {
                  profile.quickLinks.length > 0 ? profile.quickLinks.map(quickLink => (
                    <div key={quickLink.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <Link href={resolveQuickLinkHref(quickLink)} className="font-medium hover:underline">{quickLink.label}</Link>
                      <button type="button" className="rounded-md border px-3 py-1 text-sm hover:bg-muted" onClick={() => removeQuickLink(quickLink.id)}>
                        Usun
                      </button>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">Brak zapisanych szybkich linkow.</p>
                }
              </div>
            </section>
          </>
        )
      }
    </div>
  );
}