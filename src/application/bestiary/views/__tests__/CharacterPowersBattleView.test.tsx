import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { diceText, dicePoolNames } from '@/application/dice-roller/DiceRollerPanel';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import { CreateDefaultPower, CreateDefaultPowerOffense, CreateDefaultPowerSpecification } from '@/domain/characters/combat/Power';
import { powerPreset } from '@/domain/diceRoller';
import powerSpecificationsClient from '@/infrastructure/clients/powerSpecificationsClient';
import CharacterPowersBattleView from '../CharacterPowersBattleView';

const { open, record } = vi.hoisted(() => ({ open: vi.fn(), record: vi.fn() }));
vi.mock('@/application/dice-roller/DiceRollerProvider', () => ({ useOptionalDiceRoller: () => ({ open, record }) }));
vi.mock('@/infrastructure/clients/powerSpecificationsClient', () => ({ default: { get: vi.fn() } }));

const getSpecification = vi.mocked(powerSpecificationsClient.get);
beforeEach(() => {
  getSpecification.mockReset();
  open.mockReset();
  record.mockReset();
});

function renderPower(specificationId = 'library-spec')
{
  const character = CreateEmptyCharacter({ name: 'Aldara', shortName: 'Aldara', tags: [], description: 'Zwiad' });
  character.powers = [{ ...CreateDefaultPower(), name: 'Lód', level: 4, bonus: 2, essence: 12, powerSpecificationId: specificationId }];
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><CharacterPowersBattleView character={character} /></QueryClientProvider>);
}

it('uses the last available offense for high levels and edits and resets advanced essence', async () => {
  const first = { ...CreateDefaultPowerOffense(), description: 'Podstawowy atak' };
  const last = { ...CreateDefaultPowerOffense(), description: 'Silny atak', spellOffense: { ...first.spellOffense, grade: 5 } };
  getSpecification.mockResolvedValue({ ...CreateDefaultPowerSpecification(), offenses: [first, last] });
  const { container } = renderPower();
  const compact = await screen.findByRole('button', { name: diceText.open + ': Lód' });
  expect(getSpecification).toHaveBeenCalledExactlyOnceWith('library-spec');
  fireEvent.click(compact);
  expect(open).toHaveBeenLastCalledWith(powerPreset('Lód', last, dicePoolNames));

  fireEvent.click(within(container).getByRole('button', { name: '' }));
  const essence = screen.getByRole('spinbutton');
  expect(essence).toHaveValue(12);
  fireEvent.change(essence, { target: { value: '5' } });
  expect(essence).toHaveValue(5);
  fireEvent.click(screen.getByTitle('Reset essence to max'));
  expect(essence).toHaveValue(12);
  fireEvent.click(screen.getByRole('button', { name: diceText.open }));
  expect(open).toHaveBeenLastCalledWith(powerPreset('Lód', last, dicePoolNames));
  fireEvent.click(screen.getByRole('button', { name: /^rzut$/i }));
  expect(record).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: diceText.open + ': Lód' })).not.toBeInTheDocument();
});

it('keeps the cell empty when the selected specification has no offensive sets', async () => {
  getSpecification.mockResolvedValue(CreateDefaultPowerSpecification());
  const { container } = renderPower();
  await waitFor(() => expect(getSpecification).toHaveBeenCalledWith('library-spec'));
  expect(container).toBeEmptyDOMElement();
});

it('does not fetch a missing specification identifier', () => {
  const { container } = renderPower('');
  expect(container).toBeEmptyDOMElement();
  expect(getSpecification).not.toHaveBeenCalled();
});
