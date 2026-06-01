import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/characters',
}));

vi.mock('@/common/components/navbars/NavbarBreadcrumb', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar-breadcrumb" />,
}));

vi.mock('@/common/components/ApiKeySettings', () => ({
  ApiKeySettings: () => <div data-testid="api-key-settings" />,
}));

vi.mock('@/common/components/navbars/NavbarDefaultButton', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar-default-button" />,
}));

import CharacterNavbar from '@/application/characters/CharacterNavbar';

describe('CharacterNavbar', () => {
  it('renders a bestiary navigation button next to the default navbar actions', () => {
    render(<CharacterNavbar />);

    expect(screen.getByRole('link', { name: 'Bestiary' })).toHaveAttribute('href', '/bestiary');
  });
});