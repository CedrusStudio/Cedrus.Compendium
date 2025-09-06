"use client";
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from "@/components/ui/sonner"
import { Provider } from 'react-redux';
import { store } from '@/persistence/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

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
          defaultTheme='system' 
          enableSystem
          disableTransitionOnChange
        >
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
              {children}
              <ReactQueryDevtools initialIsOpen={false} />
            </Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}