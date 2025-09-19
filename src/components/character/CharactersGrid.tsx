"use client";

import { useMemo, useState } from 'react';
import CharacterCard from '@/components/character/CharacterCard';
import { Character } from '@/domain/Character';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type CharactersGridParams =
{
  characters: Character[];
  pageSize?: number;
}

export default function CharactersGrid({ characters, pageSize = 15 }: CharactersGridParams)
{
  const [page, setPage] = useState(1);
  
  characters = 
  [
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters,
    ...characters,
    ...characters,
    ...characters,
    ...characters,
    ...characters
  ]

  const totalPages = Math.max(1, Math.ceil(characters.length / pageSize));
  const clampedPage = Math.min(Math.max(page, 1), totalPages);

  const pageItems = useMemo(() =>
  {
    const start = (clampedPage - 1) * pageSize;
    return characters.slice(start, start + pageSize);
  }, [characters, clampedPage, pageSize]);
  const goTo = (p: number) => setPage(Math.min(Math.max(p, 1), totalPages));

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
          ))}

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