import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
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
