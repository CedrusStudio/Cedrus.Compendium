import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { aiCharacterDraftSchema } from '@/domain/ai-character-generation/aiCharacterDraft';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { CreateEmptyCharacter } from '@/domain/characters/Character';

const { createDraft, rejectDraft, balance, updateDraft, acceptDraft, navigate } = vi.hoisted(() => ({
  createDraft: vi.fn(),
  rejectDraft: vi.fn(),
  balance: vi.fn(),
  updateDraft: vi.fn(),
  acceptDraft: vi.fn(),
  navigate: vi.fn(),
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
  },
}));

vi.mock('@/infrastructure/clients/tagsClient', () => ({
  default: { getEntityTags: async () => ['walka', 'sesja-1'] },
}));

vi.mock('@/application/characters/components/CharacterPickerGrid', () => ({
  default: () => <div data-testid="character-picker-grid" />,
}));

import AiCharacterGenerationView from '../AiCharacterGenerationView';

function renderView()
{
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AiCharacterGenerationView />
    </QueryClientProvider>,
  );
}


function pendingDraft()
{
  const name = 'Aldara zwiadowczyni';
  const shortName = 'Aldara';
  const description = 'Zwiadowczyni z lodową magią.';
  const tags = ['walka'];
  const character = CreateEmptyCharacter({ name, shortName, description, tags });
  const now = new Date('2026-11-05T08:00:00Z');

  return aiCharacterDraftSchema.parse({
    id: 'draft-review',
    status: 'pending',
    request: { description },
    proposal: {
      header: { name, shortName, description, tags, raceId: null },
      perks: [],
      statistics: { characteristics: character.characteristics, attributes: character.attributes },
      talents: { talents: character.talents },
      equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
      combat: {
        health: character.health,
        offenses: character.offenses,
        defenses: character.defenses,
        defaultOffenseId: character.defaultOffenseId,
        defaultDefenseId: character.defaultDefenseId,
        maneuvers: [],
        stances: [],
        states: [],
        powers: [],
      },
      buffs: {
        buffProfiles: [],
        activeBuffProfileIds: [],
        stanceModifierProfiles: [],
        activeStanceModifierProfileIds: [],
        stateModifierProfiles: [],
        activeStateModifierProfileIds: [],
        otherModifierProfiles: [],
        activeOtherModifierProfileIds: [],
      },
      explanation: 'Zwiad i obrona w walce na dystans.',
      warnings: ['Sprawdź wyposażenie przed sesją.'],
    },
    validationIssues: [],
    referenceCharacterIds: [],
    provider: 'fixture',
    model: 'fixture',
    promptVersion: 'character-draft-v1',
    generationUsage: null,
    costMicroUsd: 0,
    expiresAt: new Date('2026-11-06T08:00:00Z'),
    acceptedAt: null,
    acceptedCharacterId: null,
    createdAt: now,
    updatedAt: now,
  });
}

describe('AiCharacterGenerationView', () => {
  beforeEach(() => {
    createDraft.mockReset();
    rejectDraft.mockReset();
    balance.mockReset().mockResolvedValue([]);
    updateDraft.mockReset();
    acceptDraft.mockReset();
    navigate.mockReset();
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
    const draft = pendingDraft();
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
    createDraft.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(pendingDraft());
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
});
