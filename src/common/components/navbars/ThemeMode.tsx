'use client';

import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from 'next-themes';
import { Button } from '@/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/ui/dropdown-menu';
import { displayedText } from '@/common/translations';

export default function ThemeMode() 
{
  const { setTheme } = useTheme();

  return (
    <DropdownMenu  >
      
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <FiSun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <FiMoon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setTheme('light')} className='capitalize'>
          {displayedText.light}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className='capitalize'>
          {displayedText.dark}
        </DropdownMenuItem>
      </DropdownMenuContent>

    </DropdownMenu>
  );
}