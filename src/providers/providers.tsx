"use client";
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from "@/components/ui/sonner"
import { Provider } from 'react-redux';
import { store } from '@/persistence/store';

type ProvidersProps = 
{
    children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps)
{
  return (
    <>
      <Toaster />

        <ThemeProvider 
          attribute='class'
          defaultTheme='system' 
          enableSystem
          disableTransitionOnChange
        >
          <Provider store={store}>
            {children}
          </Provider>
      </ThemeProvider>
    </>
  );
}