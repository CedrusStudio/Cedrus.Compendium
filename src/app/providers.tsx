"use client";
import { ThemeProvider } from '@/app/theme-provider'
import { Toaster } from "@/components/ui/sonner"

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
        {children}
      </ThemeProvider>
    </>
  );
}