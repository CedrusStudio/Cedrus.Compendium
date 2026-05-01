import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/common/components/navbars/ThemeMode', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-mode" />,
}));

const useAdminStatusMock = vi.fn();

vi.mock('@/common/hooks/useAdminStatus', () => ({
  useAdminStatus: () => useAdminStatusMock(),
}));

import NavbarDefaultButton from '@/common/components/navbars/NavbarDefaultButton';

describe('NavbarDefaultButton', () => {
  it('renders a link to the personalization page next to the home button', () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: false, isCheckingAdmin: false, isLoaded: true });

    render(<NavbarDefaultButton />);

    expect(screen.getByRole('link', { name: 'Personalization' })).toHaveAttribute('href', '/personalization');
  });

  it('renders an admin-panel link only for admin users', () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });

    const { rerender } = render(<NavbarDefaultButton />);

    expect(screen.getByRole('link', { name: 'Admin panel' })).toHaveAttribute('href', '/admin');

    useAdminStatusMock.mockReturnValue({ isAdmin: false, isCheckingAdmin: false, isLoaded: true });
    rerender(<NavbarDefaultButton />);

    expect(screen.queryByRole('link', { name: 'Admin panel' })).toBeNull();
  });
});