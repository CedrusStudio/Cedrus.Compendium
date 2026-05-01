import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const useThemeMock = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => useThemeMock(),
}));

vi.mock('@/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

import ThemeMode from '@/common/components/navbars/ThemeMode';

describe('ThemeMode', () => {
  it('toggles from dark to light when clicked', () => {
    const setTheme = vi.fn();
    useThemeMock.mockReturnValue({ resolvedTheme: 'dark', theme: 'dark', setTheme });

    render(<ThemeMode />);

    fireEvent.click(screen.getByRole('button'));

    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('toggles from light to dark when clicked', () => {
    const setTheme = vi.fn();
    useThemeMock.mockReturnValue({ resolvedTheme: 'light', theme: 'light', setTheme });

    render(<ThemeMode />);

    fireEvent.click(screen.getByRole('button'));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('coerces a persisted system theme to a concrete light or dark value', async () => {
    const setTheme = vi.fn();
    useThemeMock.mockReturnValue({ resolvedTheme: 'light', theme: 'system', setTheme });

    render(<ThemeMode />);

    await waitFor(() => {
      expect(setTheme).toHaveBeenCalledWith('light');
    });
  });
});