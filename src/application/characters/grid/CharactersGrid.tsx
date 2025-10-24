"use client";

import { useMemo } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/pagination";
import { usePagination } from '@/infrastructure/hooks/usePagination';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import { Separator } from '@/ui/separator';
import { Button } from '@/ui/button';
import { useDispatch } from 'react-redux';
import { actions } from '@/persistence/slices/characterSlice';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { useSearchCharactersSummary } from '../hooks/useSearchCharactersSummary';
import { CharacterSummary } from '@/persistence/charactersRepository';

type CharactersGridParams =
{
  pageSize?: number;
}

export default function CharactersGrid({ pageSize = 15 }: CharactersGridParams)
{
  const { characters: summaries } = useSearchCharactersSummary();
  const { goTo, totalPages, clampedPage } = usePagination(summaries.length, pageSize);

  const pageItems = useMemo(() =>
  {
    const start = (clampedPage - 1) * pageSize;
    return summaries.slice(start, start + pageSize);
  }, [summaries, clampedPage, pageSize]);
  
  if (summaries?.length < 1) return <NoCharacters />;

  return (
    <div className='flex flex-col items-center justify-end'>

      <div className='grid lg:grid-cols-4 gap-4 mt-6 m-4'>
      {
        pageItems.map(summary => <CharacterCard key={summary.id} summary={summary} />)
      }
      </div>

      <Pagination className='fixed bottom-10 z-1'>

        <PaginationContent>
          
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); goTo(clampedPage - 1); }}
            />
          </PaginationItem>
            
          {
            Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === clampedPage}
                  onClick={(e) => { e.preventDefault(); goTo(pageNumber); }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))
          }

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); goTo(clampedPage + 1); }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

    </div>
  );
};

function NoCharacters()
{
  return (
    <div className='flex items-center justify-center mt-8'>
      <h2 className='text-xl'>No Characters found...</h2>
    </div>
  );
}

function CharacterCard({ summary }: { summary: CharacterSummary })
{
  const dispatch = useDispatch()

  return (
    <Card className='bg-muted'>
      
      <CardHeader className='-my-1.5'>
        <CardTitle className='text-2xl flex justify-between'>
          {summary.name}

          <Button asChild size="icon" className='mt-0.5' onClick={() => dispatch(actions.clearCharacterNavbarSearch())}>
            <Link href={`/characters/${summary.id}`}><FaMagnifyingGlass /></Link>
          </Button>
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className='-mt-1'>
        <CardDescription className='text-justify'>{summary.description}</CardDescription>
      </CardContent>
      
    </Card>
  );
};