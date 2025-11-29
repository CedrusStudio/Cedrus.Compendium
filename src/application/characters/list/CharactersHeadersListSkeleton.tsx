"use client";

import { Card } from '@/ui/card';
import { Skeleton } from '@/ui/skeleton';

export default function CharactersHeadersListSkeleton()
{
  return (
    <div className='flex flex-col items-center justify-end'>
      
      <div className='flex flex-row gap-4 justify-center mt-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-10 w-32' />
        <Skeleton className='h-10 w-20' />
      </div>

      <div className='flex flex-col gap-2 mt-6 mx-auto w-full max-w-6xl px-4'>
      {
        Array.from({ length: 8 }).map((_, index) => (
          <Card className='bg-muted' key={index}>
            <div className='flex flex-row items-center gap-4 px-6 py-3'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-3 mb-2'>
                  <Skeleton className='h-5 w-48' />
                  <Skeleton className='h-5 w-20' />
                  <Skeleton className='h-5 w-16' />
                </div>
                <Skeleton className='h-4 w-full max-w-2xl' />
              </div>
              <Skeleton className='h-10 w-10 rounded-md' />
            </div>
          </Card>
        ))
      }
      </div>
    </div>
  );
}