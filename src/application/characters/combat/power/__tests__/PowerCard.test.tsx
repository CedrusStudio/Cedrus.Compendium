import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { displayedText } from '@/common/translations';
import type { Power, PowerSpecification, Spell } from '@/domain/characters/combat/Power';
import { createFixedSpellCost } from '@/domain/characters/combat/SpellCost';
import PowerCard from '@/application/characters/combat/power/PowerCard';
import PowerOffenseSelector from '@/application/characters/combat/power/PowerOffenseSelector';
import { renderWithProviders, screen, userEvent, within } from '@/__tests__/utils/testUtils';

const useQueryMock = vi.fn();

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');

  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

vi.mock('@/application/characters/combat/power/PowerRollsCard', () => ({
  __esModule: true,
  default: () => <div>Power rolls</div>,
}));

function createSpell(overrides: Partial<Spell> = {}): Spell
{
  return {
    id: 'spell-1',
    name: 'Arcane Pulse',
    description: 'Spell description',
    grade: 1,
    price: 1,
    tags: [],
    castTime: 'Standardowa',
    cost: createFixedSpellCost(5),
    cooldown: 1,
    ...overrides,
  };
}

function createPower(overrides: Partial<Power> = {}): Power
{
  return {
    id: 'power-1',
    name: 'Storm',
    type: 'moc',
    level: 1,
    bonus: 0,
    essence: 41,
    description: '',
    powerSpecificationId: 'spec-1',
    spells: overrides.spells ?? [createSpell()],
    ...overrides,
  };
}

function createPowerSpecification(overrides: Partial<PowerSpecification> = {}): PowerSpecification
{
  return {
    id: 'spec-1',
    name: 'Storm Spec',
    description: 'Specification description',
    tags: [],
    offenses: overrides.offenses ?? [
      {
        spellOffense: {
          amount: 1,
          grade: 3,
          bonus: 0,
          isPhantom: false,
          critical: { power: 0, range: 0 },
        },
        spellDamage: {
          amount: 0,
          grade: 1,
          bonus: 0,
          isPhantom: false,
        },
        description: 'Tier 1',
        cost: 23,
      },
    ],
    ...overrides,
  };
}

function createPowerOffenses(count: number)
{
  return Array.from({ length: count }, (_value, index) => ({
    spellOffense: {
      amount: 1,
      grade: 3,
      bonus: 0,
      isPhantom: false,
      critical: { power: 0, range: 0 },
    },
    spellDamage: {
      amount: 0,
      grade: 1,
      bonus: 0,
      isPhantom: false,
    },
    description: `Tier ${index + 1}`,
    cost: 20 + index,
  }));
}

function getEssenceSection(): HTMLElement
{
  const essenceSection = screen.getByText(displayedText.essence).parentElement;

  expect(essenceSection).not.toBeNull();

  return essenceSection!;
}

describe('PowerCard', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it('uses the spell cost button to reduce essence and append spell usage to progress', async () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification() });
    const user = userEvent.setup();

    renderWithProviders(<PowerCard power={createPower()} />);

    const essenceSection = getEssenceSection();
    const useSpellButton = screen.getByRole('button', { name: 'Use Arcane Pulse' });

    expect(screen.getAllByText('Arcane Pulse')).toHaveLength(1);
    expect(essenceSection).toHaveTextContent('41');
    expect(within(useSpellButton).getByText('5')).toBeInTheDocument();
    expect(within(useSpellButton).getByText('1')).toBeInTheDocument();

    await user.click(useSpellButton);

    expect(screen.getAllByText('Arcane Pulse')).toHaveLength(3);
    expect(essenceSection).toHaveTextContent('36');
    expect(useSpellButton).toBeDisabled();
  });

  it('renders więź as the visible power type label for wiez type', () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification() });

    renderWithProviders(<PowerCard power={createPower({ type: 'wiez' })} />);

    expect(screen.getByText('więź')).toBeInTheDocument();
  });

  it('renders the character-specific power description above the specification summary', () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification() });

    renderWithProviders(<PowerCard power={createPower({ description: 'Regeneracja 3 / turę\nDodatkowy efekt.' })} />);

    const description = screen.getByText(
      (_content, element) => element?.tagName === 'P' && element.textContent === 'Regeneracja 3 / turę\nDodatkowy efekt.'
    );

    expect(description).toHaveClass('whitespace-pre-wrap');
    expect(description).toHaveClass('break-words');
  });

  it('allows using different spells in the same turn', async () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification() });
    const user = userEvent.setup();

    renderWithProviders(
      <PowerCard
        power={createPower({
          spells: [
            createSpell(),
            createSpell({
              id: 'spell-2',
              name: 'Frost Step',
              castTime: 'Standardowa',
              cost: createFixedSpellCost(7),
              cooldown: 1,
            }),
          ],
        })}
      />
    );

    const essenceSection = getEssenceSection();

    await user.click(screen.getByRole('button', { name: 'Use Arcane Pulse' }));

    expect(screen.getByRole('button', { name: 'Use Frost Step' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Use Frost Step' }));

    expect(essenceSection).toHaveTextContent('29');
    expect(screen.getAllByText('Arcane Pulse')).toHaveLength(3);
    expect(screen.getAllByText('Frost Step')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Use Frost Step' })).toBeDisabled();
  });

  it('uses the selected power offense button to reduce essence and append power usage to progress', async () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification() });
    const user = userEvent.setup();

    renderWithProviders(<PowerCard power={createPower()} />);

    const essenceSection = getEssenceSection();

    expect(screen.queryByText('Storm 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use Storm 1' }));

    expect(screen.getAllByText('Storm 1')).toHaveLength(2);
    expect(essenceSection).toHaveTextContent('18');
  });

  it('disables the selected power offense button when there is not enough essence', () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification() });

    renderWithProviders(<PowerCard power={createPower({ essence: 20 })} />);

    expect(screen.getByRole('button', { name: 'Use Storm 1' })).toBeDisabled();
  });

  it('refunds essence when undo removes the last power offense usage', async () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification() });
    const user = userEvent.setup();

    renderWithProviders(<PowerCard power={createPower()} />);

    const essenceSection = getEssenceSection();

    await user.click(screen.getByRole('button', { name: 'Use Storm 1' }));

    expect(screen.getAllByText('Storm 1')).toHaveLength(2);
    expect(essenceSection).toHaveTextContent('18');

    await user.click(screen.getAllByRole('button', { name: 'Undo last power usage' })[0]);

    expect(screen.queryByText('Storm 1')).not.toBeInTheDocument();
    expect(essenceSection).toHaveTextContent('41');
  });

  it('filters spells by local name, cast time, and included tags', async () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification() });
    const user = userEvent.setup();

    renderWithProviders(
      <PowerCard
        power={createPower({
          spells: [
            createSpell(),
            createSpell({
              id: 'spell-2',
              name: 'Blink Ward',
              castTime: 'Natychmiastowa',
              tags: ['control'],
              cost: createFixedSpellCost(3),
            }),
          ],
        })}
      />
    );

    const searchInput = screen.getByPlaceholderText(displayedText.searchByName);

    await user.type(searchInput, 'Blink');

    expect(screen.getByText('Blink Ward')).toBeInTheDocument();
    expect(screen.queryByText('Arcane Pulse')).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.click(screen.getByRole('button', { name: 'Natychmiastowa' }));
    await user.click(screen.getByRole('combobox', { name: displayedText.selectExistingTag }));
    await user.click(screen.getByRole('option', { name: 'control' }));

    expect(screen.getByText('Blink Ward')).toBeInTheDocument();
    expect(screen.queryByText('Arcane Pulse')).not.toBeInTheDocument();
  });

  it('defaults the selected power offense to the 1-based level plus bonus value', () => {
    useQueryMock.mockReturnValue({
      data: createPowerSpecification({ offenses: createPowerOffenses(15) }),
    });

    renderWithProviders(
      <PowerCard
        power={createPower({
          level: 6,
          bonus: 2,
        })}
      />
    );

    expect(screen.getByText('8 / 15')).toBeInTheDocument();
    expect(screen.queryByText('9 / 15')).not.toBeInTheDocument();
  });

  it('calculates a scaled spell cost from the current power strength', async () => {
    useQueryMock.mockReturnValue({ data: createPowerSpecification({ offenses: createPowerOffenses(15) }) });
    const user = userEvent.setup();

    renderWithProviders(
      <PowerCard
        power={createPower({
          level: 4,
          bonus: 1,
          spells: [createSpell({
            cost: {
              baseCost: 5,
              scalingMode: 'multiply',
              scalingValue: 2,
              rounding: 'floor',
            },
          })],
        })}
      />
    );

    const essenceSection = getEssenceSection();
    let useSpellButton = screen.getByRole('button', { name: 'Use Arcane Pulse' });

    expect(within(useSpellButton).getByText('15')).toBeInTheDocument();

    const selectorControls = screen.getByText('5 / 15').parentElement;

    expect(selectorControls).not.toBeNull();

    const [previousButton] = within(selectorControls!).getAllByRole('button');

    await user.click(previousButton);

    expect(screen.getByText('4 / 15')).toBeInTheDocument();

    useSpellButton = screen.getByRole('button', { name: 'Use Arcane Pulse' });
    expect(within(useSpellButton).getByText('13')).toBeInTheDocument();

    await user.click(useSpellButton);

    expect(essenceSection).toHaveTextContent('28');
  });
});

describe('PowerOffenseSelector', () => {
  it('keeps the cost badge read-only when no interaction props are provided', () => {
    renderWithProviders(
      <PowerOffenseSelector
        powerSpecification={createPowerSpecification()}
        selectedIndex={0}
        onSelectIndex={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Use/i })).not.toBeInTheDocument();
  });
});