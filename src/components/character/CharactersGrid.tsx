"use client";

import { useMemo } from 'react';
import CharacterCard from '@/components/character/CharacterCard';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchCharacters } from '@/components/character/hooks/useSearchCharacters';
import { usePagination } from '@/hooks/usePagination';

type CharactersGridParams =
{
  pageSize?: number;
}

export default function CharactersGrid({ pageSize = 15 }: CharactersGridParams)
{
  const { characters } = useSearchCharacters();
  const { goTo, totalPages, clampedPage } = usePagination(characters.length, pageSize);

  const pageItems = useMemo(() =>
  {
    const start = (clampedPage - 1) * pageSize;
    return characters.slice(start, start + pageSize);
  }, [characters, clampedPage, pageSize]);
  
  if (characters?.length < 1) return <NoCharacters />;

  return (
    <>
    <Pagination className='flex justify-center mt-4'>

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

      <div className='grid md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 m-4'>
      {
        pageItems.map(character => (
          <CharacterCard key={character.id} character={character} />
        ))
      }
      </div>
    </>
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