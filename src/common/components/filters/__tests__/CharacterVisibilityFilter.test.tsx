import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CharacterVisibilityFilter from '@/common/components/filters/CharacterVisibilityFilter';
import { displayedText } from '@/common/translations';

describe('CharacterVisibilityFilter', () => {
  it('renders the three visibility options', () => {
    render(<CharacterVisibilityFilter value="all" onValueChange={vi.fn()} mineOnlyDisabled={false} />);

    expect(screen.getByText(displayedText.characterVisibilityAll)).toBeInTheDocument();
    expect(screen.getByText(displayedText.characterVisibilityMineOnly)).toBeInTheDocument();
    expect(screen.getByText(displayedText.characterVisibilityPublicOnly)).toBeInTheDocument();
  });

  it('calls onValueChange with "publicOnly" when that option is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CharacterVisibilityFilter value="all" onValueChange={onValueChange} mineOnlyDisabled={false} />);

    await user.click(screen.getByText(displayedText.characterVisibilityPublicOnly));

    expect(onValueChange).toHaveBeenCalledWith('publicOnly');
  });

  it('calls onValueChange with "mineOnly" when that option is clicked and enabled', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CharacterVisibilityFilter value="all" onValueChange={onValueChange} mineOnlyDisabled={false} />);

    await user.click(screen.getByText(displayedText.characterVisibilityMineOnly));

    expect(onValueChange).toHaveBeenCalledWith('mineOnly');
  });

  it('disables the "mine only" option and does not fire onValueChange when clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CharacterVisibilityFilter value="all" onValueChange={onValueChange} mineOnlyDisabled />);

    const mineOnlyTrigger = screen.getByText(displayedText.characterVisibilityMineOnly).closest('button');
    expect(mineOnlyTrigger).toBeDisabled();

    await user.click(screen.getByText(displayedText.characterVisibilityMineOnly));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
