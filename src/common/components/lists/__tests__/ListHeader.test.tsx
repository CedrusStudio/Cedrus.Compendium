import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/common/translations', () => ({
  displayedText: {
    searchByName: 'Search by name',
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
});