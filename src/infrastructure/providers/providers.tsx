"use client";
import { ThemeProvider } from '@/infrastructure/providers/theme-provider'
import { Toaster } from "@/ui/sonner"
import { Provider } from 'react-redux';
import { store } from '@/persistence/slices/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import DiceRollerProvider from '@/application/dice-roller/DiceRollerProvider';

type ProvidersProps = 
{
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps)
{
    const [queryClient] = useState(() => new QueryClient
    ({
      defaultOptions: 
      {
        queries: 
        {
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid refetching immediately on the client
          staleTime: 1000 * 60 * 5, // 5 minutes
        },
      },
    }));

  return (
    <>
      <Toaster />
        <ThemeProvider 
          attribute='class'
          defaultTheme='dark' 
          enableSystem={false}
          disableTransitionOnChange
        >
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <DiceRollerProvider>{children}</DiceRollerProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}
