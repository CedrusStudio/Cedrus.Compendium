import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuickTagsPanel, QuickTagsToggle } from '../QuickTagsSection';

vi.mock('@/common/hooks/usePersonalization', () => ({
  usePersonalization: () => ({
    hasApiKey: true,
    profile: {
      quickTagsByContext: { bestiary: ['wojak'] },
      quickExcludeTagsByContext: { bestiary: ['nieumarli'] },
    },
  }),
}));

function Filters() {
  const [open, setOpen] = useState(true);
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  return <>
    <QuickTagsToggle open={open} controlsId="quick-tags" onOpenChange={setOpen} />
    <QuickTagsPanel id="quick-tags" open={open} context="bestiary"
      includedTags={included} excludedTags={excluded}
      onIncludedTagsChange={setIncluded} onExcludedTagsChange={setExcluded} />
    <output aria-label="Active filters">{JSON.stringify({ included, excluded })}</output>
  </>;
}

describe('QuickTagsSection', () => {
  it('collapses both tag rows without clearing active filters and restores their selected state', () => {
    render(<Filters />);
    fireEvent.click(screen.getByRole('button', { name: 'wojak' }));
    fireEvent.click(screen.getByRole('button', { name: 'nieumarli' }));
    const toggle = screen.getByRole('button', { name: 'Szybkie tagi' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'wojak' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'nieumarli' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Active filters')).toHaveTextContent('{"included":["wojak"],"excluded":["nieumarli"]}');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'wojak' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'nieumarli' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'wojak' }));
    expect(screen.getByLabelText('Active filters')).toHaveTextContent('{"included":[],"excluded":["nieumarli"]}');
  });
});
