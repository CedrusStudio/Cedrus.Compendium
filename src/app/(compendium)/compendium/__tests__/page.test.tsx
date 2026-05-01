import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import CompendiumPage from '../page';

describe('CompendiumPage', () => {
  it('renders the compendium categories in the expected order', async () => {
    render(await CompendiumPage());

    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map(heading => heading.textContent);

    expect(headings).toEqual([
      'Manewry',
      'Postawy',
      'Stany',
      'Atuty',
      'Moce',
      'Zaklęcia',
      'Rasy',
      'Ekwipunek',
    ]);
  });
});