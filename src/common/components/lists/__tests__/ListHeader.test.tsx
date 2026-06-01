import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/common/translations', () => ({
  displayedText: {
    searchByName: 'Search by name',
    grade: 'Grade',
  },
}));

vi.mock('@/common/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('@/common/components/filters/TagFilter', () => ({
  __esModule: true,
  default: () => <div>Tag filter</div>,
}));

vi.mock('@/application/personalization/PersonalizedQuickTags', () => ({
  __esModule: true,
  default: ({ mode }: { mode?: 'include' | 'exclude' }) => <div>{mode === 'exclude' ? 'Quick tags exclude' : 'Quick tags include'}</div>,
}));

import ListHeader from '@/common/components/lists/ListHeader';

describe('ListHeader', () => {
  it('keeps action controls in a dedicated wrapper when personalized quick tags are shown', () => {
    render(
      <ListHeader
        searchInput=""
        handleSearchInputChange={() => undefined}
        searchTags={[]}
        handleSearchTagsChange={() => undefined}
        excludedTags={[]}
        handleExcludedTagsChange={() => undefined}
        availableTags={[]}
        tagsLoading={false}
        personalizationContext="spells"
      >
        <button type="button">Group view</button>
        <button type="button">Add item</button>
      </ListHeader>,
    );

    expect(screen.getByText('Quick tags include')).toBeInTheDocument();
    expect(screen.getByText('Quick tags exclude')).toBeInTheDocument();

    const actionsWrapper = screen.getByText('Group view').parentElement;

    expect(actionsWrapper).not.toBeNull();
    expect(actionsWrapper).toHaveClass('flex', 'w-full', 'flex-wrap', 'items-start', 'gap-2');
    expect(screen.getByText('Add item').parentElement).toBe(actionsWrapper);
  });

  it('renders an optional grade filter input', () => {
    const handleGradeFilterChange = vi.fn();

    render(
      <ListHeader
        searchInput=""
        handleSearchInputChange={() => undefined}
        gradeFilter=""
        handleGradeFilterChange={handleGradeFilterChange}
        searchTags={[]}
        handleSearchTagsChange={() => undefined}
        excludedTags={[]}
        handleExcludedTagsChange={() => undefined}
        availableTags={[]}
        tagsLoading={false}
      />,
    );

    const gradeInput = screen.getByRole('spinbutton', { name: 'Grade' });

    expect(gradeInput).toHaveAttribute('min', '0');
    expect(gradeInput).toHaveAttribute('max', '15');

    fireEvent.change(gradeInput, { target: { value: '7' } });

    expect(handleGradeFilterChange).toHaveBeenCalledOnce();
  });
});