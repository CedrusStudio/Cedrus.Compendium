import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createDraft, rejectDraft } = vi.hoisted(() => ({
  createDraft: vi.fn(),
  rejectDraft: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/infrastructure/clients/aiCharacterDraftsClient', () => ({
  default: {
    create: createDraft,
    reject: rejectDraft,
  },
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

describe('AiCharacterGenerationView', () => {
  beforeEach(() => {
    createDraft.mockReset();
    rejectDraft.mockReset();
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
});
