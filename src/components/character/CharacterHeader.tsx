"use client";

import { Character } from "@/domain/Character";
import links from '@/utils/links';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function CharacterHeader(input: { character: Character })
{
    const currentFullPath = usePathname();
    const characterId = getCharacterId(currentFullPath);

    return (
        <div className="flex flex-row gap-4 justify-around">
        
        <h2 className='text-xl text-center font-semibold text-primary pt-2 pb-12 capitalize'>
            {input.character.name}
        </h2>

        <div className='flex flex-row my-2 lg:mt-6 gap-y-4 p-1'>
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

        </div>
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