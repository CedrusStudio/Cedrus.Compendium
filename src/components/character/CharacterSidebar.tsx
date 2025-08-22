"use client";

import links from '@/utils/links';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export type CharacterSidebarProps = 
{
  characterPath: string;
};

export default function CharacterSidebar()
{
  const currentFullPath = usePathname();
  const characterId = getCharacterId(currentFullPath);

  return (
    <aside className="h-full py-1 bg-muted rounded-md">

      <div className='flex flex-col my-2 lg:mt-6 gap-y-4 p-1'>
      {
        links.map(link => 
        (
          <Button asChild key={link.href} variant={currentFullPath.endsWith(link.href) || (currentFullPath.endsWith(characterId) && link.href === '/') ? 'default' : 'ghost'} >
            <Link href={calculateCharacterPath(currentFullPath, characterId!, link.href)} className="flex items-center gap-x-2">
              {link.icon} <span className='capitalize'>{link.label}</span>
            </Link>
          </Button>
        ))
      }
      </div>

    </aside>
  );
};

function getCharacterId(url: string): string 
{
  const match = url.match(/\/characters\/([^\/]+)/);
  return match ? match[1] : '';
}

function calculateCharacterPath(currentFullPath: string, characterId: string, link: string) 
{
  const pathUpToId = currentFullPath.slice(0, currentFullPath.indexOf(characterId));
  return `${pathUpToId}${characterId}/${link}`;
}