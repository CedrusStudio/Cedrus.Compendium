import { describe, expect, it } from 'vitest';
import { displayedText } from '@/common/translations';
import type { Maneuver } from '@/domain/characters/combat/Maneuver';
import ManeuversCard from '@/application/characters/combat/ManeuversCard';
import { renderWithProviders, screen, userEvent } from '@/__tests__/utils/testUtils';

function createManeuver(overrides: Partial<Maneuver> = {}): Maneuver
{
  return {
    id: 'maneuver-1',
    name: 'Heavy Sweep',
    description: 'Maneuver description',
    grade: 1,
    requirements: [],
    price: 1,
    tags: ['martial'],
    castTime: 'Standardowa',
    cooldown: 1,
    ...overrides,
  };
}

describe('ManeuversCard', () => {
  it('filters maneuvers by local name, cast time, and included tags', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ManeuversCard
        maneuvers={[
          createManeuver(),
          createManeuver({
            id: 'maneuver-2',
            name: 'Blink Step',
            castTime: 'Natychmiastowa',
            tags: ['mobility'],
          }),
        ]}
      />
    );

    const searchInput = screen.getByPlaceholderText(displayedText.searchByName);

    await user.type(searchInput, 'Blink');

    expect(screen.getByText('Blink Step')).toBeInTheDocument();
    expect(screen.queryByText('Heavy Sweep')).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.click(screen.getByRole('button', { name: 'Natychmiastowa' }));
    await user.click(screen.getByRole('combobox', { name: displayedText.selectExistingTag }));
    await user.click(screen.getByText('mobility'));

    expect(screen.getByText('Blink Step')).toBeInTheDocument();
    expect(screen.queryByText('Heavy Sweep')).not.toBeInTheDocument();
  });
});