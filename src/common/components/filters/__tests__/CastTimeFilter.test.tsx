import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CastTimeFilter from '@/common/components/filters/CastTimeFilter';
import { renderWithProviders, userEvent } from '@/__tests__/utils/testUtils';
import { CastTime } from '@/domain/characters/Castable';

function Harness()
{
  const [selectedCastTimes, setSelectedCastTimes] = React.useState<CastTime[]>([]);

  return (
    <>
      <CastTimeFilter selectedCastTimes={selectedCastTimes} onSelectedCastTimesChange={setSelectedCastTimes} />
      <div data-testid="selected-cast-times">{selectedCastTimes.join(',')}</div>
    </>
  );
}

describe('CastTimeFilter', () => {
  it('does not emit a no-op change when all is already selected', async () => {
    const user = userEvent.setup();
    const onSelectedCastTimesChange = vi.fn();

    renderWithProviders(
      <CastTimeFilter
        selectedCastTimes={[]}
        onSelectedCastTimesChange={onSelectedCastTimesChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'wszystkie' }));

    expect(onSelectedCastTimesChange).not.toHaveBeenCalled();
  });

  it('toggles multiple cast times and clears selection with the all badge', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Harness />);

    const selectedCastTimes = screen.getByTestId('selected-cast-times');
    const allButton = screen.getByRole('button', { name: 'wszystkie' });
    const standardButton = screen.getByRole('button', { name: 'Standardowa' });
    const immediateButton = screen.getByRole('button', { name: 'Natychmiastowa' });

    expect(allButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(standardButton);

    expect(selectedCastTimes).toHaveTextContent('Standardowa');
    expect(standardButton).toHaveAttribute('aria-pressed', 'true');
    expect(standardButton).toHaveClass('bg-green-700');
    expect(allButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(immediateButton);

    expect(selectedCastTimes).toHaveTextContent('Standardowa,Natychmiastowa');
    expect(immediateButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(standardButton);

    expect(selectedCastTimes).toHaveTextContent('Natychmiastowa');
    expect(standardButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(allButton);

    expect(selectedCastTimes).toBeEmptyDOMElement();
    expect(allButton).toHaveAttribute('aria-pressed', 'true');
  });
});