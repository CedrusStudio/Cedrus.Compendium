import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import { createSelection } from '../builder/combatantSelection';
import { FakeSimulationWorker as WorkerDouble } from '../hooks/__tests__/FakeSimulationWorker';
import { aggregateResults } from '@/domain/combat-lab/simulation/aggregateResults';
import type { CombatantSelection } from '../builder/combatantSelection';

const transport = vi.hoisted(() => ({ save: vi.fn(), invalidate: vi.fn(), success: vi.fn() }));
vi.mock('@/lib/env', () => ({ languageSettings: { NEXT_LANGUAGE: 'pl-PL' } }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: transport.invalidate }) }));
vi.mock('sonner', () => ({ toast: { success: transport.success } }));
vi.mock('@/infrastructure/clients/combatLabClient', () => ({ default: { saveSimulation: transport.save } }));
vi.mock('../hooks/useCharacterById', () => ({ useCharacterById: (id?: string) => ({ character: id ? characters[id] : undefined }) }));
vi.mock('../hooks/usePowerSpecifications', () => ({ usePowerSpecifications: () => ({ specifications: specifications }) }));
vi.mock('../builder/CombatantPicker', () => ({ CombatantPicker: ({ title, onChange }: { title: string; onChange: (selection: CombatantSelection) => void }) => (
  <fieldset><legend>{title}</legend>{Object.entries(characters).map(([id, character]) => (
    <button key={id} onClick={() => onChange(createSelection(id, character.name))}>{character.name}</button>
  ))}</fieldset>
) }));
vi.mock('../builder/CombatantStatsCard', () => ({ CombatantStatsCard: () => null }));
vi.mock('../replay/CombatReplay', () => ({ CombatReplay: () => <div>Replay</div> }));
vi.mock('../analysis/StatisticsDashboard', () => ({ StatisticsDashboard: () => null }));
vi.mock('@/domain/combat-lab/persistence/reproduceFight', () => ({ reproduceFight: () => ({}) }));
import { SimulationRunner } from './SimulationRunner';

const characters = Object.fromEntries([['a', 'Aldara'], ['b', 'Borin'], ['c', 'Celina']].map(([id, name]) => [id, {
  ...CreateEmptyCharacter({ name, shortName: name, description: 'Test', tags: [] }), id,
}]));
const specifications = {};
const summary = { ...aggregateResults([]), count: 1000 };
const done = { type: 'done' as const, summary, results: [] };

async function ready() {
  const user = userEvent.setup();
  render(<SimulationRunner />);
  await user.click(within(screen.getByRole('group', { name: 'Postać A' })).getByRole('button', { name: 'Aldara' }));
  await user.click(within(screen.getByRole('group', { name: 'Postać B' })).getByRole('button', { name: 'Borin' }));
  return user;
}
async function complete() {
  const user = await ready();
  await user.click(screen.getByRole('button', { name: 'Uruchom symulację' }));
  expect(WorkerDouble.instances).toHaveLength(1);
  act(() => { WorkerDouble.last().emit(done); });
  await screen.findByRole('region', { name: 'Wynik zakończonej symulacji' });
  return user;
}

beforeEach(() => {
  WorkerDouble.reset();
  transport.save.mockReset().mockResolvedValue('saved');
  transport.invalidate.mockReset().mockResolvedValue(undefined);
  transport.success.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe('simulation runner result ownership', () => {
  it('shows real progress and deliberate cancellation without exposing a completed result', async () => {
    const user = await ready();
    await user.click(screen.getByRole('button', { name: 'Uruchom symulację' }));
    expect(screen.getByRole('progressbar', { name: 'Postęp symulacji' })).toHaveAttribute('value', '0');
    act(() => { WorkerDouble.last().emit({ type: 'progress', completed: 500, total: 1000 }); });
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '500');
    await user.click(screen.getByRole('button', { name: 'Anuluj symulację' }));
    expect(await screen.findByText('Anulowano symulację.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zapisz bieg' })).not.toBeInTheDocument();
    expect(WorkerDouble.last().terminate).toHaveBeenCalledOnce();
  });

  it('keeps summary labels and default save title attached to the completed A/B snapshot', async () => {
    const user = await complete();
    await user.click(within(screen.getByRole('group', { name: 'Postać A' })).getByRole('button', { name: 'Celina' }));
    expect(screen.getByText('Win Rate — Aldara')).toBeVisible();
    expect(screen.queryByText('Win Rate — Celina')).not.toBeInTheDocument();
    expect(screen.getByText(/Ustawienia zostały zmienione/)).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Nazwa' })).toHaveAttribute('placeholder', 'Aldara vs Borin');
    await user.click(screen.getByRole('button', { name: 'Zapisz bieg' }));
    await waitFor(() => expect(transport.save).toHaveBeenCalledExactlyOnceWith('Aldara vs Borin', expect.objectContaining({
      a: expect.objectContaining({ id: 'a' }), b: expect.objectContaining({ id: 'b' }),
    }), summary));
  });

  it('prevents repeated saves while pending and after success', async () => {
    const user = await complete();
    let finish!: (value: string) => void;
    transport.save.mockImplementation(() => new Promise<string>(resolve => { finish = resolve; }));
    await user.dblClick(screen.getByRole('button', { name: 'Zapisz bieg' }));
    expect(transport.save).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Zapisywanie biegu…' })).toBeDisabled();
    await act(async () => { finish('saved'); });
    expect(screen.getByRole('button', { name: 'Zapisz bieg' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Zapisano bieg symulacji.');
  });

  it('retains the result after a failed save and retries only on an explicit click', async () => {
    const user = await complete();
    transport.save.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Zapisz bieg' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wynik pozostaje dostępny.');
    expect(screen.getByRole('region', { name: 'Wynik zakończonej symulacji' })).toBeVisible();
    expect(transport.save).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Zapisz bieg' }));
    await waitFor(() => expect(transport.save).toHaveBeenCalledTimes(2));
  });

  it('does not treat cache-refresh failure as save failure', async () => {
    const user = await complete();
    transport.invalidate.mockRejectedValueOnce(new Error('refresh failed'));
    await user.click(screen.getByRole('button', { name: 'Zapisz bieg' }));
    await screen.findByText('Zapisano bieg symulacji.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zapisz bieg' })).toBeDisabled();
  });

  it('retries a failed worker with the retained setup', async () => {
    const user = await ready();
    await user.click(screen.getByRole('button', { name: 'Uruchom symulację' }));
    act(() => { WorkerDouble.last().emit({ type: 'error', message: 'failed' }); });
    expect(await screen.findByRole('alert')).toHaveTextContent('Symulacja nie powiodła się.');
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
    expect(WorkerDouble.instances).toHaveLength(2);
    act(() => { WorkerDouble.last().emit(done); });
    expect(await screen.findByRole('region', { name: 'Wynik zakończonej symulacji' })).toBeVisible();
  });

  it('rejects invalid counts and supplies associated control labels', async () => {
    await ready();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Liczba walk' }), { target: { value: '1.5' } });
    expect(screen.getByRole('button', { name: 'Uruchom symulację' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('dodatnią liczbą całkowitą');
    expect(WorkerDouble.instances).toHaveLength(0);
    expect(screen.getByRole('combobox', { name: 'Strategia A' })).toBeVisible();
  });

  it('validates replay seeds against the completed run rather than the current count', async () => {
    await complete();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Liczba walk' }), { target: { value: '5' } });
    const seed = screen.getByRole('spinbutton', { name: 'Seed (0 - 999)' });
    fireEvent.change(seed, { target: { value: '999' } });
    expect(screen.getByText('Replay')).toBeVisible();
    fireEvent.change(seed, { target: { value: '1000' } });
    expect(screen.queryByText('Replay')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('całkowity seed');
    fireEvent.change(seed, { target: { value: '1.5' } });
    expect(seed).toHaveAttribute('aria-invalid', 'true');
  });
});
