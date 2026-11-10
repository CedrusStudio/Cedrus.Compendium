import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDraftCatalog, createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { CreateDefaultPerk } from '@/domain/characters/Perk';
import type { CharacterSummary } from '@/infrastructure/searchQueries/characters/createCharacterSummaryQuery';

const { createDraft, rejectDraft, balance, updateDraft, acceptDraft, navigate, catalog, discardPrepared } = vi.hoisted(() => ({
  createDraft: vi.fn(),
  rejectDraft: vi.fn(),
  balance: vi.fn(),
  updateDraft: vi.fn(),
  acceptDraft: vi.fn(),
  navigate: vi.fn(),
  catalog: vi.fn(),
  discardPrepared: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigate }),
}));

vi.mock('@/infrastructure/clients/aiCharacterDraftsClient', () => ({
  default: {
    create: createDraft,
    reject: rejectDraft,
    balance,
    update: updateDraft,
    accept: acceptDraft,
    catalog,
    discardPreparedLocalDraft: discardPrepared,
  },
}));

vi.mock('@/infrastructure/clients/tagsClient', () => ({
  default: { getEntityTags: async () => ['walka', 'sesja-1'] },
}));

vi.mock('@/application/characters/components/CharacterPickerGrid', () => ({
  default: ({ onSelectCharacterSummary }: { onSelectCharacterSummary: (summary: CharacterSummary) => void }) => (
    <div>
      {['Aldara', 'Borowit', 'Czarny', 'Daria'].map((name, index) => (
        <button key={name} onClick={() => onSelectCharacterSummary({ id: `reference-${index}`, name, shortName: name, tags: [] })}>
          {name}
        </button>
      ))}
    </div>
  ),
}));

import AiCharacterGenerationView from '../AiCharacterGenerationView';

function renderView(provider?: 'local')
{
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AiCharacterGenerationView provider={provider} />
    </QueryClientProvider>,
  );
}


describe('AiCharacterGenerationView', () => {
  beforeEach(() => {
    createDraft.mockReset();
    rejectDraft.mockReset();
    balance.mockReset().mockResolvedValue([]);
    updateDraft.mockReset();
    acceptDraft.mockReset();
    navigate.mockReset();
    catalog.mockReset().mockResolvedValue([]);
    discardPrepared.mockReset();
  });


  it.each([
    { provider: undefined, idle: 'Wygeneruj wersję roboczą', loading: 'Generowanie wersji roboczej…' },
    { provider: 'local' as const, idle: 'Wczytaj przygotowaną wersję roboczą', loading: 'Wczytywanie wersji roboczej…' },
  ])('prevents duplicate requests while $loading and displays the server message', async ({ provider, idle, loading }) => {
    let finish!: (error: unknown) => void;
    createDraft.mockImplementationOnce(() => new Promise((_resolve, reject) => { finish = reject; }));
    renderView(provider);
    fireEvent.change(screen.getByLabelText('Opis postaci'), { target: { value: 'Zwiadowca z łukiem' } });
    fireEvent.click(screen.getByRole('button', { name: idle }));
    const pending = await screen.findByRole('button', { name: loading });
    expect(pending).toBeDisabled();
    fireEvent.click(pending);
    expect(createDraft).toHaveBeenCalledTimes(1);
    finish({ isAxiosError: true, response: { data: { error: 'Nie znaleziono szkicu.' } } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Nie znaleziono szkicu.');
    expect(screen.getByRole('button', { name: idle })).toBeEnabled();
  });

  it('keeps the preview editable after a validation error in a numeric field', async () => {
    createDraft.mockResolvedValue(createPendingDraft());
    renderView();
    fireEvent.change(screen.getByLabelText('Opis postaci'), { target: { value: 'Zwiadowca z łukiem' } });
    fireEvent.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    const vitality = await screen.findByRole('spinbutton', { name: 'żywotność' });
    fireEvent.change(vitality, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(updateDraft).not.toHaveBeenCalled();
    expect(vitality).toHaveValue(null);

    fireEvent.change(vitality, { target: { value: '15' } });
    updateDraft.mockImplementation(async (_id: string, proposal: AiCharacterProposal) => ({ ...createPendingDraft(), proposal }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    await waitFor(() => expect(updateDraft).toHaveBeenCalledWith('draft-review', expect.objectContaining({
      combat: expect.objectContaining({ health: expect.objectContaining({ vitality: 15 }) }),
    })));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('renders the preview of a draft with no default attack or defense sets', async () => {
    const draft = createPendingDraft();
    draft.proposal!.combat = { ...draft.proposal!.combat, offenses: [], defenses: [], defaultOffenseId: null, defaultDefenseId: null };
    createDraft.mockResolvedValue(draft);
    renderView();
    fireEvent.change(screen.getByLabelText('Opis postaci'), { target: { value: 'Zwiadowca z łukiem' } });
    fireEvent.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    expect(await screen.findByText('Brak zestawów obrony.')).toBeVisible();
    expect(screen.getByText('Brak zestawów ataku.')).toBeVisible();
    expect(screen.getAllByText(/Żaden zestaw nie jest domyślny/)).toHaveLength(2);
    expect(screen.queryByRole('radio', { name: 'domyślny' })).not.toBeInTheDocument();
  });

  it('keeps generation disabled until the description meets the server minimum', async () => {
    const user = userEvent.setup();
    renderView();

    const generateButton = screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' });
    expect(generateButton).toBeDisabled();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowca z lodową magią.');

    expect(generateButton).toBeEnabled();
  });

  it('sends only the requested description, constraints and selected-reference IDs to the BFF', async () => {
    const user = userEvent.setup();
    createDraft.mockResolvedValue({
      id: 'draft-1',
      status: 'pending',
      proposal: null,
      validationIssues: [],
      request: {},
      referenceCharacterIds: [],
      provider: 'openai',
      model: 'gpt-5.6-luna',
      promptVersion: 'character-draft-v1',
      generationUsage: null,
      costMicroUsd: 0,
      expiresAt: new Date(),
      acceptedAt: null,
      acceptedCharacterId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    renderView();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowca z lodową magią.');
    await user.type(screen.getByLabelText('Dodatkowe ograniczenia (opcjonalne)'), 'Bez ciężkiego pancerza.');
    await user.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));

    await waitFor(() => expect(createDraft).toHaveBeenCalledWith({
      description: 'Zwiadowca z lodową magią.',
      referenceCharacterIds: [],
      constraints: {
        language: 'pl-PL',
        // Untouched checkboxes must travel as an explicit refusal, not as an
        // omission the server has to guess about.
        allowCustomEquipment: false,
        allowCustomAbilities: false,
        notes: 'Bez ciężkiego pancerza.',
      },
    }));
  });

  it('asks for authoring permission only for the box that was ticked', async () => {
    const user = userEvent.setup();
    createDraft.mockResolvedValue({
      id: 'draft-1',
      status: 'pending',
      proposal: null,
      validationIssues: [],
      request: {},
      referenceCharacterIds: [],
      provider: 'openai',
      model: 'gpt-5.6-luna',
      promptVersion: 'character-draft-v1',
      generationUsage: null,
      costMicroUsd: 0,
      expiresAt: new Date(),
      acceptedAt: null,
      acceptedCharacterId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    renderView();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowca z lodową magią.');
    await user.click(screen.getByRole('checkbox', { name: /Wolno wymyślić ekwipunek/ }));
    await user.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));

    await waitFor(() => expect(createDraft).toHaveBeenCalledWith(expect.objectContaining({
      constraints: expect.objectContaining({
        allowCustomEquipment: true,
        allowCustomAbilities: false,
      }),
    })));
  });

  it('keeps unsaved edits local, saves the reviewed proposal and opens the accepted character', async () => {
    const user = userEvent.setup();
    const draft = createPendingDraft();
    createDraft.mockResolvedValue(draft);
    updateDraft.mockRejectedValueOnce(new Error('save failed'));
    updateDraft.mockImplementation(async (_id: string, proposal: AiCharacterProposal) => ({
      ...draft, proposal, updatedAt: new Date('2026-11-05T08:01:00Z'),
    }));
    acceptDraft.mockResolvedValue('accepted-character');
    renderView();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowczyni z lodową magią.');
    await user.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    expect(await screen.findByText('Sprawdź wyposażenie przed sesją.')).toBeVisible();
    await waitFor(() => expect(balance).toHaveBeenCalledWith('draft-review'));

    const removeTag = () => screen.getByRole('button', { name: 'Usuń tag walka' });
    await user.click(removeTag());
    expect(screen.getByText('Niezapisane zmiany')).toBeVisible();
    expect(updateDraft).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^Odrzuć zmiany$/ }));
    expect(removeTag()).toBeVisible();
    await user.click(removeTag());
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(await screen.findByText('Nie udało się utworzyć wersji roboczej. Spróbuj ponownie później.')).toBeVisible();
    expect(screen.getByText('Niezapisane zmiany')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

    await waitFor(() => expect(updateDraft).toHaveBeenLastCalledWith('draft-review', {
      ...draft.proposal,
      header: { ...draft.proposal?.header, tags: [] },
    }));
    await waitFor(() => expect(balance).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Niezapisane zmiany')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Zatwierdź i utwórz postać' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/characters/accepted-character/edit?tab=character'));
    expect(acceptDraft).toHaveBeenCalledWith('draft-review');
  });

  it('allows retry after a failed request and removes a discarded draft from the preview', async () => {
    const user = userEvent.setup();
    createDraft.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(createPendingDraft());
    rejectDraft.mockResolvedValue(undefined);
    renderView();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowczyni z lodową magią.');
    const generate = screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' });
    await user.click(generate);
    expect(await screen.findByText('Nie udało się utworzyć wersji roboczej. Spróbuj ponownie później.')).toBeVisible();

    await user.click(generate);
    const discard = await screen.findByRole('button', { name: 'Odrzuć tę wersję roboczą' });
    await user.click(discard);
    await waitFor(() => expect(screen.queryByText('Aldara zwiadowczyni')).not.toBeInTheDocument());
    expect(rejectDraft).toHaveBeenCalledWith('draft-review');
    expect(generate).toBeEnabled();
  });

  it('saves the chosen compendium race by identifier and lets it be removed from the draft', async () => {
    const user = userEvent.setup();
    const draft = createPendingDraft();
    createDraft.mockResolvedValue(draft);
    catalog.mockImplementation(async (kind: string, query: string) => kind === 'race' && query === 'elf'
      ? [{ id: 'race-elf', name: 'Elf', entry: { id: 'race-elf', name: 'Elf' } }]
      : []);
    updateDraft.mockImplementation(async (_id: string, proposal: AiCharacterProposal) => ({
      ...draft, proposal, updatedAt: new Date('2026-11-05T08:02:00Z'),
    }));
    renderView();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowczyni z lodową magią.');
    await user.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    await user.click(await screen.findByRole('button', { name: 'Wybierz rasę' }));
    const picker = within(screen.getByRole('dialog'));
    expect(await picker.findByText('Nic nie pasuje do tej nazwy.')).toBeVisible();
    await user.type(picker.getByRole('textbox', { name: 'Szukaj w kompendium' }), 'elf{Enter}');
    await user.click(await picker.findByRole('button', { name: 'Elf' }));
    expect(catalog).toHaveBeenCalledWith('race', 'elf');
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    await waitFor(() => expect(updateDraft).toHaveBeenLastCalledWith('draft-review', expect.objectContaining({
      header: expect.objectContaining({ raceId: 'race-elf' }),
    })));

    await user.click(screen.getByRole('button', { name: 'Usuń rasę' }));
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    await waitFor(() => expect(updateDraft).toHaveBeenLastCalledWith('draft-review', expect.objectContaining({
      header: expect.objectContaining({ raceId: null }),
    })));
  });

  it('saves numeric changes in the correct statistic, health and combat slots', async () => {
    const user = userEvent.setup();
    const draft = createPendingDraft();
    const proposal = draft.proposal!;
    const defense = { ...proposal.combat.defenses[0], id: '01K7QBNAVF1VY58R2G1ASKYMZG', name: 'Obrona dystansowa' };
    const offense = { ...structuredClone(proposal.combat.offenses[0]), id: '01K7QBNAVF1VY58R2G1ASKYMZH', name: 'Atak dystansowy' };
    proposal.combat.defenses.push(defense);
    proposal.combat.offenses.push(offense);
    createDraft.mockResolvedValue(draft);
    updateDraft.mockImplementation(async (_id: string, next: AiCharacterProposal) => ({ ...draft, proposal: next }));
    renderView();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowczyni z lodową magią.');
    await user.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    await screen.findByText('Obrona dystansowa');

    fireEvent.change(screen.getByLabelText('wartość: siła'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('żywotność'), { target: { value: '7' } });

    const defenseSet = within(screen.getByText(defense.name).parentElement!.parentElement!);
    await user.click(defenseSet.getByRole('radio', { name: 'domyślny' }));
    fireEvent.change(defenseSet.getByLabelText('pancerz'), { target: { value: '4' } });

    const offenseSet = within(screen.getByText(offense.name).parentElement!.parentElement!);
    await user.click(offenseSet.getByRole('radio', { name: 'domyślny' }));
    const weaponSlot = within(offenseSet.getByText('broń wiodąca', { exact: false }).parentElement!);
    fireEvent.change(weaponSlot.getByLabelText('kości'), { target: { value: '2' } });
    fireEvent.change(weaponSlot.getByLabelText('zasięg kryt.'), { target: { value: '1' } });

    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

    await waitFor(() => expect(updateDraft).toHaveBeenCalledWith(draft.id, {
      ...proposal,
      statistics: {
        ...proposal.statistics,
        characteristics: {
          ...proposal.statistics.characteristics,
          strength: { ...proposal.statistics.characteristics.strength, value: 3 },
        },
      },
      combat: {
        ...proposal.combat,
        health: { ...proposal.combat.health, vitality: 7 },
        defenses: [proposal.combat.defenses[0], { ...defense, protection: 4 }],
        offenses: [
          proposal.combat.offenses[0],
          {
            ...offense,
            leadingWeapon: {
              ...offense.leadingWeapon,
              amount: 2,
              critical: { ...offense.leadingWeapon.critical, range: 1 },
            },
          },
        ],
        defaultDefenseId: defense.id,
        defaultOffenseId: offense.id,
      },
    }));
  });

  it('replaces a compendium perk with the complete record for the new rank', async () => {
    const user = userEvent.setup();
    const draft = createPendingDraft();
    const low = { ...CreateDefaultPerk(), name: 'Fortel', grade: 1 };
    const high = { ...CreateDefaultPerk(), id: '01K7QBNAVF1VY58R2G1ASKYMZJ', name: 'Fortel', grade: 2, price: 4, description: 'Zmyłka w walce' };
    draft.proposal!.perks = [low];
    createDraft.mockResolvedValue(draft);
    updateDraft.mockImplementation(async (_id: string, next: AiCharacterProposal) => ({ ...draft, proposal: next }));
    catalog.mockResolvedValue([{
      id: high.id,
      name: high.name,
      grade: high.grade,
      price: high.price,
      description: high.description,
      requirements: ['Zręczność'],
      entry: high,
    }]);
    renderView();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowczyni z lodową magią.');
    await user.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    await user.click(await screen.findByRole('button', { name: 'Fortel (1)' }));
    const picker = within(screen.getByRole('dialog'));
    expect(picker.getByRole('textbox', { name: 'Szukaj w kompendium' })).toHaveValue('Fortel');
    expect(await picker.findByText('Wymagania: Zręczność')).toBeVisible();
    await user.click(picker.getByRole('button', { name: /Fortel \(2\).*koszt 4/ }));
    expect(catalog).toHaveBeenCalledWith('perk', 'Fortel');
    expect(screen.queryByRole('button', { name: 'Fortel (1)' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

    await waitFor(() => expect(updateDraft).toHaveBeenCalledWith(draft.id, {
      ...draft.proposal,
      perks: [high],
    }));
  });

  it('keeps character and session tags together in the draft and normalizes a new tag', async () => {
    const user = userEvent.setup();
    const draft = createPendingDraft();
    createDraft.mockResolvedValue(draft);
    updateDraft.mockImplementation(async (_id: string, next: AiCharacterProposal) => ({ ...draft, proposal: next }));
    renderView();

    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowczyni z lodową magią.');
    await user.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    const addTag = await screen.findByRole('combobox', { name: 'Dodaj tag' });
    await user.click(addTag);
    expect(await screen.findByText('Sesje')).toBeVisible();
    await user.click(screen.getByRole('option', { name: 'sesja-1' }));
    await user.click(addTag);
    await user.type(screen.getByPlaceholderText('Szukaj tagu…'), '  ZWIAD ');
    await user.click(await screen.findByRole('option', { name: /Użyj: „zwiad"/ }));
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

    await waitFor(() => expect(updateDraft).toHaveBeenCalledWith(draft.id, {
      ...draft.proposal,
      header: { ...draft.proposal!.header, tags: ['walka', 'sesja-1', 'zwiad'] },
    }));
  });


  it.each([
    { title: 'Atuty', kind: 'perk', select: (p: AiCharacterProposal) => p.perks },
    { title: 'Manewry', kind: 'maneuver', select: (p: AiCharacterProposal) => p.combat.maneuvers },
    { title: 'Postawy', kind: 'stance', select: (p: AiCharacterProposal) => p.combat.stances },
    { title: 'Stany', kind: 'state', select: (p: AiCharacterProposal) => p.combat.states },
    { title: 'Bronie', kind: 'weapon', select: (p: AiCharacterProposal) => p.equipment.weapons },
    { title: 'Zbroje', kind: 'armor', select: (p: AiCharacterProposal) => p.equipment.armors },
    { title: 'Tarcze', kind: 'shield', select: (p: AiCharacterProposal) => p.equipment.shields },
    { title: 'Przedmioty', kind: 'inventoryItem', select: (p: AiCharacterProposal) => p.equipment.inventory },
    { title: 'Wierzchowce', kind: 'mount', select: (p: AiCharacterProposal) => p.equipment.mounts },
  ] as const)('adds and removes $kind in its own proposal collection', async ({ title, kind, select }) => {
    const user = userEvent.setup();
    const draft = createPendingDraft();
    const entry = createDraftCatalog()[kind];
    createDraft.mockResolvedValue(draft);
    catalog.mockImplementation(async (requestedKind: string) => requestedKind === kind ? [{
      id: entry.id, name: entry.name, entry,
    }] : []);
    updateDraft.mockImplementation(async (_id: string, proposal: AiCharacterProposal) => ({ ...draft, proposal }));
    renderView();

    fireEvent.change(screen.getByLabelText('Opis postaci'), { target: { value: draft.request.description } });
    fireEvent.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    const row = within((await screen.findByText(title + ':', { exact: true })).parentElement!);
    await user.click(row.getByRole('button', { name: '+ Dodaj' }));
    const picker = within(screen.getByRole('dialog', { name: 'Dodaj: ' + title }));
    await user.click(await picker.findByRole('button', { name: entry.name }));
    expect(catalog.mock.calls.filter(([requestedKind]) => requestedKind !== 'race')).toEqual([[kind, '']]);

    fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    await waitFor(() => expect(updateDraft).toHaveBeenCalledTimes(1));
    const saved = updateDraft.mock.calls[0][1] as AiCharacterProposal;
    const entries = select(saved);
    expect(entries).toEqual([expect.objectContaining({ id: entry.id, name: entry.name })]);
    expect(select(draft.proposal!)).toEqual([]);
    await waitFor(() => expect(screen.queryByText('Niezapisane zmiany')).not.toBeInTheDocument());

    fireEvent.click(row.getByRole('button', { name: 'Usuń ' + entry.name }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    await waitFor(() => expect(updateDraft).toHaveBeenCalledTimes(2));
    expect(updateDraft.mock.calls[1][1]).toEqual(draft.proposal);
  });

  it('shows meaningful balance deviations and permits acceptance with a known review issue', async () => {
    const user = userEvent.setup();
    const draft = { ...createPendingDraft(), validationIssues: ['Uzupełnij osłonę.'] };
    const high = { name: 'Fechtunek', value: 8, median: 4, high: 6, max: 7, band: 'powyżej maksimum' };
    createDraft.mockResolvedValue(draft);
    acceptDraft.mockRejectedValueOnce(new Error('conflict')).mockResolvedValueOnce('created-review');
    balance.mockResolvedValue([{
      tag: 'walka', characters: 15, speciality: high,
      attributes: [
        high,
        { ...high, name: 'Precyzja', band: 'w normie', value: 5 },
        { ...high, name: 'Kondycja', band: 'poniżej mediany', value: 0 },
      ],
      maneuvers: { value: 2, median: 3, high: 5, band: 'poniżej mediany' },
      perks: { value: 1, median: 1, high: 4, band: 'w normie' },
    }]);
    renderView();

    fireEvent.change(screen.getByLabelText('Opis postaci'), { target: { value: draft.request.description } });
    await user.click(screen.getByRole('checkbox', { name: /Wolno wymyślić zdolności/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    expect(await screen.findByText('Uzupełnij osłonę.')).toBeVisible();
    expect(await screen.findByText('(15 postaci w kompendium)')).toBeVisible();
    expect(screen.getByText(/mediana 4, p90 6, max 7/, { selector: 'li span' })).toBeVisible();
    expect(screen.queryByText(/^Precyzja 5$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Kondycja 0$/)).not.toBeInTheDocument();
    expect(createDraft).toHaveBeenCalledWith(expect.objectContaining({
      constraints: expect.objectContaining({ allowCustomAbilities: true, allowCustomEquipment: false }),
    }));

    const accept = screen.getByRole('button', { name: 'Zatwierdź mimo braków i popraw w edytorze' });
    await user.click(accept);
    expect(await screen.findByText('Nie udało się utworzyć wersji roboczej. Spróbuj ponownie później.')).toBeVisible();
    expect(navigate).not.toHaveBeenCalled();
    await user.click(accept);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/characters/created-review/edit?tab=character'));
  });

  it('limits reference characters to three distinct entries and sends only the remaining identifiers', async () => {
    const user = userEvent.setup();
    createDraft.mockResolvedValue({ ...createPendingDraft(), proposal: null });
    renderView();
    const add = screen.getByRole('button', { name: 'Dodaj postać referencyjną' });
    await user.click(add);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aldara' }));
    await user.click(add);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aldara' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borowit' }));
    await user.click(add);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Czarny' }));
    expect(add).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Borowit ×/ }));
    expect(add).toBeEnabled();
    await user.type(screen.getByLabelText('Opis postaci'), 'Zwiadowczyni z lodową magią.');
    await user.click(screen.getByRole('button', { name: 'Wygeneruj wersję roboczą' }));
    await waitFor(() => expect(createDraft).toHaveBeenCalledWith(expect.objectContaining({
      referenceCharacterIds: ['reference-0', 'reference-2'],
    })));
  });

  it('reports local-file removal independently of generating or accepting a draft', async () => {
    const user = userEvent.setup();
    discardPrepared.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    renderView('local');
    const discard = screen.getByRole('button', { name: 'Usuń przygotowaną wersję roboczą' });
    expect(screen.getByRole('button', { name: 'Wczytaj przygotowaną wersję roboczą' })).toBeDisabled();
    await user.click(discard);
    expect(await screen.findByText(/Usunięto draft.json/)).toBeVisible();
    await user.click(discard);
    expect(await screen.findByText('Nie było czego usuwać.')).toBeVisible();
    expect(createDraft).not.toHaveBeenCalled();
    expect(acceptDraft).not.toHaveBeenCalled();
  });
});
