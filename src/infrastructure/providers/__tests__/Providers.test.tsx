import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const themeProviderSpy = vi.fn();

vi.mock('@/infrastructure/providers/theme-provider', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode }) => {
    themeProviderSpy(props);
    return <div>{children}</div>;
  },
}));

vi.mock('@/ui/sonner', () => ({
  Toaster: () => null,
}));

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

import Providers from '@/infrastructure/providers/providers';

describe('Providers', () => {
  it('disables system theme mode on the root ThemeProvider', () => {
    render(
      <Providers>
        <div>child</div>
      </Providers>,
    );

    expect(themeProviderSpy).toHaveBeenCalledWith(expect.objectContaining({
      attribute: 'class',
      defaultTheme: 'dark',
      enableSystem: false,
      disableTransitionOnChange: true,
    }));
  });
});
