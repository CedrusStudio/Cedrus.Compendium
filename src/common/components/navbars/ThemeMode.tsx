'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from 'next-themes';
import { Button } from '@/ui/button';
import { displayedText } from '@/common/translations';

const subscribeToMount = () => () => {};
const clientMounted = () => true;
const serverMounted = () => false;

export default function ThemeMode() 
{
  const { resolvedTheme, setTheme, theme } = useTheme();
  const isMounted = useSyncExternalStore(subscribeToMount, clientMounted, serverMounted);

  useEffect(() => 
  {
    if (theme === 'system') 
    {
      setTheme(resolvedTheme === 'light' ? 'light' : 'dark');
    }
  }, [resolvedTheme, setTheme, theme]);

  const isDarkMode = (resolvedTheme ?? theme) === 'dark';
  const nextTheme = isDarkMode ? 'light' : 'dark';
  const ariaLabel = isMounted
    ? `Switch to ${nextTheme === 'light' ? displayedText.light : displayedText.dark}`
    : 'Switch theme';

  return (
    <Button
      variant='outline'
      size='icon'
      aria-label={ariaLabel}
      onClick={() => setTheme(nextTheme)}
    >
      <FiSun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      <FiMoon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
    </Button>
  );
}
