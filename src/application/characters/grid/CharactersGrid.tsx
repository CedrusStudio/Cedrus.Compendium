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
import { useSearchCharacters } from '@/application/characters/hooks/useSearchCharacters';
import { usePagination } from '@/infrastructure/hooks/usePagination';
import { Character } from '@/domain/characters/Character';
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
import { actions } from '@/persistence/characterSlice';
import { FaMagnifyingGlass } from "react-icons/fa6";

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
        pageItems.map(character => <CharacterCard key={character.id} character={character} />)
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

function CharacterCard({ character }: { character: Character })
{
  const dispatch = useDispatch()

  return (
    <Card className='bg-muted'>
      
      <CardHeader className='-my-1.5'>
        <CardTitle className='text-2xl flex justify-between'>
          {character.name}

          <Button asChild size="icon" className='mt-0.5' onClick={() => dispatch(actions.clearCharacterNavbarSearch())}>
              <Link href={`/characters/${character.id}`}><FaMagnifyingGlass /></Link>
          </Button>
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className='-mt-1'>
        <CardDescription className='text-justify'>{character.description}</CardDescription>
      </CardContent>
      
    </Card>
  );
};