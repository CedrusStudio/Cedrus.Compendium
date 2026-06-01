"use client";

import Link from 'next/link';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ulid } from 'ulid';
import { ApiKeySettings } from '@/common/components/ApiKeySettings';
import MainCharacterBadge from '@/application/personalization/MainCharacterBadge';
import MainCharacterButton from '@/application/personalization/MainCharacterButton';
import ExistingTagSelect from '@/common/components/filters/ExistingTagSelect';
import SelectOneOfStrings from '@/common/components/selects/SelectOneOfStrings';
import { Input } from '@/common/components/ui/input';
import { type EntityType, useEntityTags } from '@/common/hooks/useEntityTags';
import { usePersonalization } from '@/common/hooks/usePersonalization';
import { useFavoriteCharacters } from '@/application/personalization/useFavoriteCharacters';
import { personalizationContextLabels, personalizationRouteLabels, resolveQuickLinkHref } from '@/application/personalization/personalizationUtils';
import { createPersonalizationProfileExport, MAX_QUICK_TAGS_PER_CONTEXT, parsePersonalizationProfileImport, type PersonalizationContext, personalizationContexts, quickLinkRoutes, QuickLink, QuickLinkRoute } from '@/persistence/slices/personalizationSlice';
import { bestiaryColumnPreferenceKeys, resolveBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';
import { displayedText } from '@/common/translations';
import { deleteIcon, editIcon, goToIcon, homeIcon } from '@/common/icons';
import { Button } from "@/ui/button";

const PERSONALIZATION_EXPORT_FILE_NAME = 'cedrus-personalization-profile.json';

const contextSelectItems = personalizationContexts.map(context => ({
  label: personalizationContextLabels[context],
  value: context,
}));
const quickLinkRouteSelectItems = quickLinkRoutes.map(route => ({
  label: personalizationRouteLabels[route],
  value: route,
}));
const quickTagModeSelectItems = [
  { label: 'Dołączające', value: 'include' },
  { label: 'Wykluczające', value: 'exclude' },
] as const;

type QuickTagMode = typeof quickTagModeSelectItems[number]['value'];

const personalizationTagEntities: Record<PersonalizationContext, EntityType> = {
  characters: 'characters',
  bestiary: 'characters',
  maneuvers: 'maneuvers',
  stances: 'stances',
  states: 'states',
  perks: 'perks',
  powers: 'powerSpecifications',
  spells: 'spells',
  races: 'races',
  weapons: 'weapons',
  armors: 'armors',
  shields: 'shields',
  inventory: 'inventory',
  mounts: 'mounts',
};

export default function PersonalizationPage()
{
  const {
    apiKey,
    hasApiKey,
    isLoaded,
    isSavingToDatabase = false,
    profile,
    setUserName,
    setBestiaryColumnVisibility,
    clearBestiaryColumnVisibility,
    addQuickTag,
    addQuickExcludeTag = () => undefined,
    removeQuickTag,
    removeQuickExcludeTag = () => undefined,
    removeFavoriteCharacter,
    setMainCharacter,
    addQuickLink,
    removeQuickLink,
    updateQuickLink,
    replaceProfile = () => undefined,
    saveToDatabase = async () => profile,
  } = usePersonalization();
  const { favoriteCharacters, isLoading } = useFavoriteCharacters();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedContext, setSelectedContext] = useState(personalizationContexts[0]);
  const [selectedQuickTagMode, setSelectedQuickTagMode] = useState<QuickTagMode>('include');
  const [quickTagInput, setQuickTagInput] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<QuickLinkRoute>('/characters/favorites');
  const [quickLinkLabel, setQuickLinkLabel] = useState('');
  const [editingQuickLinkId, setEditingQuickLinkId] = useState<string | null>(null);
  const [editingQuickLinkLabel, setEditingQuickLinkLabel] = useState('');
  const [editingQuickLinkRoute, setEditingQuickLinkRoute] = useState<QuickLinkRoute>('/characters/favorites');
  const [userNameInput, setUserNameInput] = useState('');
  const [bestiaryColumnVisibilityDraft, setBestiaryColumnVisibilityDraft] = useState(resolveBestiaryColumnVisibility());
  const { tags: availableTagsForSelectedContext, isLoading: areSelectedContextTagsLoading } = useEntityTags(personalizationTagEntities[selectedContext]);

  const favoriteCharacterOptions = useMemo(
    () => favoriteCharacters.map(character => ({ value: character.id, label: character.name })),
    [favoriteCharacters],
  );
  const selectedContextIncludeQuickTags = profile.quickTagsByContext[selectedContext] ?? [];
  const selectedContextExcludeQuickTags = profile.quickExcludeTagsByContext[selectedContext] ?? [];
  const selectedContextQuickTags = selectedQuickTagMode === 'include' ? selectedContextIncludeQuickTags : selectedContextExcludeQuickTags;
  const selectedContextConfiguredQuickTags = [...selectedContextIncludeQuickTags, ...selectedContextExcludeQuickTags];

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
    if (selectedQuickTagMode === 'include') {
      addQuickTag(selectedContext, quickTagInput);
    } else {
      addQuickExcludeTag(selectedContext, quickTagInput);
    }

    setQuickTagInput('');
  };

  const handleSelectExistingQuickTag = (tag: string) => {
    if (selectedQuickTagMode === 'include') {
      addQuickTag(selectedContext, tag);
      return;
    }

    addQuickExcludeTag(selectedContext, tag);
  };

  const handleRemoveSavedQuickTag = (context: PersonalizationContext, tag: string, mode: QuickTagMode) => {
    if (mode === 'include') {
      removeQuickTag(context, tag);
      return;
    }

    removeQuickExcludeTag(context, tag);
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

  const handleStartQuickLinkEdit = (quickLink: Extract<QuickLink, { type: 'route' }>) =>
  {
    setEditingQuickLinkId(quickLink.id);
    setEditingQuickLinkLabel(quickLink.label);
    setEditingQuickLinkRoute(quickLink.href);
  };

  const handleCancelQuickLinkEdit = () =>
  {
    setEditingQuickLinkId(null);
    setEditingQuickLinkLabel('');
    setEditingQuickLinkRoute('/characters/favorites');
  };

  const handleSaveQuickLinkEdit = () =>
  {
    if (!editingQuickLinkId) return;

    const label = editingQuickLinkLabel.trim();
    if (!label) return;

    updateQuickLink({
      id: editingQuickLinkId,
      label,
      type: 'route',
      href: editingQuickLinkRoute,
    });
    handleCancelQuickLinkEdit();
  };

  const handleExportProfile = () =>
  {
    const exportPayload = createPersonalizationProfileExport(profile);
    const fileUrl = URL.createObjectURL(new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' }));
    const downloadLink = document.createElement('a');

    downloadLink.href = fileUrl;
    downloadLink.download = PERSONALIZATION_EXPORT_FILE_NAME;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(fileUrl);

    toast.success('Wyeksportowano konfiguracje aktywnego profilu do pliku JSON.');
  };

  const handleImportProfile = async (event: ChangeEvent<HTMLInputElement>) =>
  {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    try {
      const importedProfile = parsePersonalizationProfileImport(JSON.parse(await file.text()));

      if (!importedProfile) {
        toast.error('Wybrany plik nie zawiera poprawnej konfiguracji personalizacji.');
        return;
      }

      replaceProfile(importedProfile);
      handleCancelQuickLinkEdit();
      setQuickLinkLabel('');
      setQuickTagInput('');
      toast.success('Zaimportowano konfiguracje dla aktywnego API key.');
    } catch {
      toast.error('Nie udalo sie odczytac pliku JSON z konfiguracja.');
    }
  };

  const handleSaveToDatabase = async () =>
  {
    try {
      await saveToDatabase();
      toast.success('Zapisano konfiguracje aktywnego profilu w bazie danych.');
    } catch {
      toast.error('Nie udalo sie zapisac konfiguracji aktywnego profilu w bazie danych.');
    }
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
            {
              hasApiKey && (
                <Button type="button" onClick={handleSaveToDatabase} disabled={isSavingToDatabase}>
                  {isSavingToDatabase ? 'Zapisywanie...' : 'Save to database'}
                </Button>
              )
            }
            <Button asChild variant="outline" size="icon">
            <Link href="/" aria-label="Wroc do strony glownej">{homeIcon("h-[1.2rem] w-[1.2rem]")}</Link>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-16 gap-4">
        <div className="rounded-lg border p-4 md:col-span-4">
          <p className="text-sm text-muted-foreground">Nazwa uzytkownika</p>
          <p className="mt-2 font-medium break-all">{profile.userName ?? 'brak'}</p>
        </div>
        <div className="rounded-lg border p-4 md:col-span-6">
          <p className="text-sm text-muted-foreground">Aktywny API key</p>
          <p className="mt-2 font-medium break-all">{apiKey ?? 'brak'}</p>
        </div>
        <div className="rounded-lg border p-4 md:col-span-3">
          <p className="text-sm text-muted-foreground">Ulubione postacie</p>
          <p className="mt-2 text-2xl font-semibold">{profile.favoriteCharacterIds.length}</p>
        </div>
        <div className="rounded-lg border p-4 md:col-span-3">
          <p className="text-sm text-muted-foreground">Szybkie linki</p>
          <p className="mt-2 text-2xl font-semibold">{profile.quickLinks.length}</p>
        </div>
      </div>

      {
        !hasApiKey ? (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-lg font-medium">Najpierw ustaw API key.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Profile personalizacji są rozdzielone per API key, więc bez klucza nie da się zapisać preferencji.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Profil użytkownika</h2>
                <p className="text-sm text-muted-foreground">Powiąż czytelną nazwę z aktywnym API key bez zmiany samego klucza.</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={userNameInput}
                  onChange={event => setUserNameInput(event.target.value)}
                  placeholder="Nazwa użytkownika dla tego API key"
                  className="md:flex-1"
                />

                <Button type="button" variant="outline" onClick={() => setUserName(userNameInput)}>
                  Zapisz nazwę
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUserName(undefined);
                    setUserNameInput('');
                  }}
                >
                  Wyczyść nazwę
                </Button>
              </div>
            </section>

            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Import i eksport</h2>
                <p className="text-sm text-muted-foreground">Przenos konfiguracje aktywnego profilu w pliku JSON bez eksportowania samego API key.</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Button type="button" variant="outline" onClick={handleExportProfile}>
                  Eksportuj konfiguracje JSON
                </Button>

                <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()}>
                  Importuj konfiguracje JSON
                </Button>

                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  aria-label="Importuj konfiguracje JSON"
                  onChange={handleImportProfile}
                />
              </div>
            </section>

            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Szybkie tagi</h2>
                <p className="text-sm text-muted-foreground">Możesz zapisać maksymalnie 5 tagów dołączających i 5 wykluczających na kontekst.</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <SelectOneOfStrings
                  id="personalization-context-select"
                  value={selectedContext}
                  items={contextSelectItems}
                  onChange={value => setSelectedContext(value as typeof selectedContext)}
                  triggerClassName="w-full md:w-[220px]"
                  capitalize={false}
                />

                <SelectOneOfStrings
                  id="personalization-tag-mode-select"
                  value={selectedQuickTagMode}
                  items={quickTagModeSelectItems as unknown as { label: string; value: string }[]}
                  onChange={value => setSelectedQuickTagMode(value as QuickTagMode)}
                  triggerClassName="w-full md:w-[220px]"
                  capitalize={false}
                />

                <Input
                  value={quickTagInput}
                  onChange={event => setQuickTagInput(event.target.value)}
                  placeholder={selectedQuickTagMode === 'include' ? 'Dodaj szybki tag dołączający' : 'Dodaj szybki tag wykluczający'}
                  className="md:flex-1"
                />

                <Button type="button" variant="outline" onClick={handleAddQuickTag}>
                  {selectedQuickTagMode === 'include' ? 'Dodaj tag dołączający' : 'Dodaj tag wykluczający'}
                </Button>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <p className="text-sm text-muted-foreground">Lub wybierz istniejący tag dla wybranego kontekstu i typu.</p>
                <ExistingTagSelect
                  selectorId="personalization-existing-tag-select"
                  availableTags={availableTagsForSelectedContext}
                  selectedTags={selectedContextConfiguredQuickTags}
                  onSelectTag={handleSelectExistingQuickTag}
                  isLoading={areSelectedContextTagsLoading}
                  disabled={selectedContextQuickTags.length >= MAX_QUICK_TAGS_PER_CONTEXT}
                  triggerClassName="w-full md:w-[260px]"
                />
              </div>

              <div className="space-y-3">
                {
                  personalizationContexts.map(context => {
                    const includeQuickTags = profile.quickTagsByContext[context] ?? [];
                    const excludeQuickTags = profile.quickExcludeTagsByContext[context] ?? [];
                    const quickTagGroups = [
                      { label: 'Dołączające', mode: 'include' as const, tags: includeQuickTags },
                      { label: 'Wykluczające', mode: 'exclude' as const, tags: excludeQuickTags },
                    ];

                    return (
                      <div key={context}>
                        <p className="text-sm font-medium">{personalizationContextLabels[context]}</p>
                        <div className="mt-2 space-y-3">
                          {
                            quickTagGroups.map(quickTagGroup => (
                              <div key={`${context}-${quickTagGroup.mode}`}>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{quickTagGroup.label}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {
                                    quickTagGroup.tags.length > 0 ? quickTagGroup.tags.map(tag => (
                                      <div
                                        key={`${context}-${quickTagGroup.mode}-${tag}`}
                                        className={`inline-flex items-center gap-2 rounded-full border pl-3 pr-1 py-1 text-sm ${quickTagGroup.mode === 'exclude' ? 'border-destructive/30 bg-destructive/5' : ''}`}
                                      >
                                        <span>{tag}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="size-7 rounded-full"
                                          aria-label={`Usun tag ${tag}`}
                                          title={`Usun tag ${tag}`}
                                          onClick={() => handleRemoveSavedQuickTag(context, tag, quickTagGroup.mode)}
                                        >
                                          {deleteIcon}
                                        </Button>
                                      </div>
                                    )) : <span className="text-sm text-muted-foreground">Brak zapisanych tagów.</span>
                                  }
                                </div>
                              </div>
                            ))
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBestiaryColumnVisibility(bestiaryColumnVisibilityDraft)}
                >
                  Zapisz kolumny bestiariusza
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    clearBestiaryColumnVisibility();
                    setBestiaryColumnVisibilityDraft(resolveBestiaryColumnVisibility());
                  }}
                >
                  Przywróć domyślne kolumny
                </Button>
              </div>
            </section>

            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Ulubione postacie</h2>
                <p className="text-sm text-muted-foreground">Dodawaj je z listy postaci albo z widoku pojedynczej postaci.</p>
              </div>

              {
                isLoading ? <p className="text-sm text-muted-foreground">Ladowanie postaci...</p> : (
                  <div className="space-y-3">
                    {
                      favoriteCharacterOptions.length > 0 ? favoriteCharacterOptions.map(character => (
                        <div key={character.value} className="flex items-center justify-between gap-3 rounded-md border p-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Link href={`/characters/${character.value}`} className="truncate font-medium">{character.label}</Link>
                            {
                              profile.mainCharacterId === character.value && (
                                <MainCharacterBadge characterLabel={character.label} />
                              )
                            }
                          </div>
                          <div className="flex items-center gap-2">
                            <MainCharacterButton characterId={character.value} />
                            <Button asChild type="button" variant="outline" size="icon">
                              <Link
                                href={`/characters/${character.value}`}
                                aria-label={`Przejdz do postaci ${character.label}`}
                                title={`Przejdz do postaci ${character.label}`}
                              >
                                {goToIcon}
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              aria-label={`Usun z ulubionych ${character.label}`}
                              title={`Usun z ulubionych ${character.label}`}
                              onClick={() => removeFavoriteCharacter(character.value)}
                            >
                              {deleteIcon}
                            </Button>
                          </div>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">Brak ulubionych postaci dla tego profilu.</p>
                    }
                  </div>
                )
              }
            </section>

            <section className="rounded-lg border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Szybkie linki</h2>
                <p className="text-sm text-muted-foreground">Te skroty pojawia sie na stronie glownej tylko dla aktywnego profilu.</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={quickLinkLabel}
                  onChange={event => setQuickLinkLabel(event.target.value)}
                  placeholder="Nazwa linku"
                  className="md:flex-1"
                />

                <SelectOneOfStrings
                  id="quick-link-route-select"
                  value={selectedRoute}
                  items={quickLinkRouteSelectItems}
                  onChange={value => setSelectedRoute(value as QuickLinkRoute)}
                  triggerClassName="w-full md:w-[260px]"
                  capitalize={false}
                />

                <Button type="button" variant="outline" onClick={handleAddQuickLink}>
                  Dodaj link
                </Button>
              </div>

              <div className="space-y-3">
                {
                  profile.quickLinks.length > 0 ? profile.quickLinks.map(quickLink => (
                    <div key={quickLink.id} className="space-y-3 rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={resolveQuickLinkHref(quickLink)} className="block truncate font-medium hover:underline">{quickLink.label}</Link>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {quickLink.type === 'route' ? personalizationRouteLabels[quickLink.href] : 'Skrot do postaci'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {
                            quickLink.type === 'route' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label={`Edytuj link ${quickLink.label}`}
                                title={`Edytuj link ${quickLink.label}`}
                                onClick={() => handleStartQuickLinkEdit(quickLink)}
                              >
                                {editIcon}
                              </Button>
                            )
                          }
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            aria-label={`Usun link ${quickLink.label}`}
                            title={`Usun link ${quickLink.label}`}
                            onClick={() => {
                              if (editingQuickLinkId === quickLink.id) {
                                handleCancelQuickLinkEdit();
                              }
                              removeQuickLink(quickLink.id);
                            }}
                          >
                            {deleteIcon}
                          </Button>
                        </div>
                      </div>

                      {
                        quickLink.type === 'route' && editingQuickLinkId === quickLink.id && (
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto_auto]">
                            <Input
                              value={editingQuickLinkLabel}
                              onChange={event => setEditingQuickLinkLabel(event.target.value)}
                              placeholder="Nazwa linku"
                            />
                            <SelectOneOfStrings
                              id={`quick-link-edit-route-${quickLink.id}`}
                              value={editingQuickLinkRoute}
                              items={quickLinkRouteSelectItems}
                              onChange={value => setEditingQuickLinkRoute(value as QuickLinkRoute)}
                              triggerClassName="w-full"
                              capitalize={false}
                            />
                            <Button type="button" onClick={handleSaveQuickLinkEdit} disabled={!editingQuickLinkLabel.trim()}>
                              Zapisz
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancelQuickLinkEdit}>
                              Anuluj
                            </Button>
                          </div>
                        )
                      }
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