import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ManagedStructuredRequirement } from '@/infrastructure/clients/requirementsManagementClient';
import StructuredRequirementsManager from '../StructuredRequirementsManager';

const { getRequirements, editRequirement, deleteRequirement } = vi.hoisted(() => ({
  getRequirements: vi.fn(),
  editRequirement: vi.fn(),
  deleteRequirement: vi.fn(),
}));

vi.mock('@/infrastructure/clients/requirementsManagementClient', () => ({
  default: {
    getStructuredRequirements: getRequirements,
    editStructuredRequirement: editRequirement,
    deleteStructuredRequirement: deleteRequirement,
  },
}));

vi.mock('@/common/hooks/useAllEntityNames', () => ({
  useAllEntityNames: () => ({ perks: ['Większy Fechtunek'] }),
}));

beforeEach(() => {
  localStorage.removeItem('admin-requirements-kind-filter');
  getRequirements.mockReset();
  editRequirement.mockReset().mockResolvedValue({ updatedCount: 2 });
  deleteRequirement.mockReset().mockResolvedValue({ updatedCount: 2 });
});

function renderManager(rows: ManagedStructuredRequirement[])
{
  getRequirements.mockResolvedValue(rows);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <StructuredRequirementsManager />
    </QueryClientProvider>,
  );
}

it('filters the visible rows without changing totals and persists the kind filter', async () => {
  const user = userEvent.setup();
  const rows: ManagedStructuredRequirement[] = [
    { requirement: { kind: 'rankless', text: 'Umie pływać' }, count: 2 },
    { requirement: { kind: 'ranked', group: 'attributes', targetKey: 'fencing', value: 3 }, count: 1 },
  ];
  const view = renderManager(rows);

  expect(await screen.findByText('Umie pływać')).toBeVisible();
  const structured = screen.getByRole('button', { name: /^Ustrukturyzowane\s*\(1\)$/ });
  await user.click(structured);
  expect(structured).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByText('Umie pływać')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Sugestie mapowania/ })).not.toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('Filtruj...'), { target: { value: 'nieznany wpis' } });
  expect(screen.getByText('Brak wymagan strukturalnych dla wybranego typu.')).toBeVisible();
  expect(screen.getByRole('button', { name: /^Wszystkie\s*\(2\)$/ })).toBeVisible();

  view.unmount();
  renderManager(rows);
  expect(await screen.findByRole('button', { name: /^Ustrukturyzowane\s*\(1\)$/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByText('Umie pływać')).not.toBeInTheDocument();
});

it('approves a mapping to the compendium entry and refetches the requirements', async () => {
  const user = userEvent.setup();
  const original = { kind: 'rankless', text: 'Większy Fechtunek 2' } as const;
  renderManager([{ requirement: original, count: 2 }]);

  await user.click(await screen.findByRole('button', { name: 'Sugestie mapowania (1)' }));
  await user.click(screen.getByRole('button', { name: 'Zatwierdź' }));

  await waitFor(() => expect(editRequirement).toHaveBeenCalledExactlyOnceWith({
    entity: 'perks',
    original,
    replacements: [{ kind: 'ranked', group: 'perks', targetKey: 'Większy Fechtunek', value: 2 }],
  }));
  await waitFor(() => expect(getRequirements).toHaveBeenCalledTimes(2));
  await user.click(screen.getByRole('button', { name: 'Odrzuć' }));
  expect(screen.getByText('Brak sugestii dla wymagań tekstowych tego typu.')).toBeVisible();
});

it('keeps the editor open after a failed save and sends only populated replacements on retry', async () => {
  const user = userEvent.setup();
  const original = { kind: 'rankless', text: 'Przygotowanie bojowe' } as const;
  editRequirement.mockRejectedValueOnce({ response: { data: { message: 'Konflikt edycji' } } });
  renderManager([{ requirement: original, count: 2 }]);

  await user.click(await screen.findByRole('button', { name: 'Edytuj' }));
  const editor = within(screen.getByRole('dialog'));
  const add = editor.getByRole('button', { name: 'Dodaj kolejne wymaganie (i)' });
  const save = editor.getByRole('button', { name: 'Zapisz' });
  const fields = () => editor.getAllByPlaceholderText('np. Zapał Wojownika');

  fireEvent.change(fields()[0], { target: { value: '' } });
  await user.click(save);
  expect(await editor.findByText(/Uzupelnij przynajmniej jedno wymaganie/)).toBeVisible();
  expect(editRequirement).not.toHaveBeenCalled();

  fireEvent.change(fields()[0], { target: { value: 'Wyszkolenie bojowe' } });
  await user.click(add);
  fireEvent.change(fields()[1], { target: { value: 'Próba kondycji' } });
  await user.click(add);
  await user.click(save);
  expect(await editor.findByText('Nie udalo sie zapisac: Konflikt edycji')).toBeVisible();
  expect(fields()[1]).toHaveValue('Próba kondycji');
  await user.click(save);

  await waitFor(() => expect(editRequirement).toHaveBeenLastCalledWith({
    entity: 'perks',
    original,
    replacements: [
      { kind: 'rankless', text: 'Wyszkolenie bojowe' },
      { kind: 'rankless', text: 'Próba kondycji' },
    ],
  }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('deletes an exact requirement only after confirming its use count', async () => {
  const user = userEvent.setup();
  const requirement = { kind: 'rankless', text: 'Umie pływać' } as const;
  renderManager([{ requirement, count: 2 }]);

  const remove = await screen.findByRole('button', { name: 'Usun' });
  await user.click(remove);
  const confirmation = within(screen.getByRole('alertdialog'));
  expect(confirmation.getByText(/zostanie usuniete z 2 rekordow/)).toBeVisible();
  await user.click(confirmation.getByRole('button', { name: 'Anuluj' }));
  expect(deleteRequirement).not.toHaveBeenCalled();

  await user.click(remove);
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Potwierdz usuniecie' }));
  await waitFor(() => expect(deleteRequirement).toHaveBeenCalledExactlyOnceWith({ entity: 'perks', requirement }));
});
