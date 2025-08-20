'use client';

import links from '@/utils/links';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function Sidebar()
{
  const pathname = usePathname();

  return (
    <aside className="h-full py-4 px-8 bg-muted">

      <div className='flex flex-col mt-20 gap-y-4'>
      {
        links.map(link => 
        (
          <Button asChild key={link.href} variant={pathname.endsWith(link.href) ? 'default' : 'ghost'} >
            <Link href={getLinkPath(pathname, link.href)} className="flex items-center gap-x-2">
              {link.icon} <span className='capitalize'>{link.label}</span>
            </Link>
          </Button>
        ))
      }
      </div>

    </aside>
  );
};

const getLinkPath = (pathname: string, href: string) => pathname
    .substring(0, pathname.lastIndexOf('/') + 1) + href.replace('/', '');