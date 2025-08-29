"use client";

import { Character } from '@/domain/Character';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { actions } from '@/persistence/characterSlice';

export default function CharacterCard({ character }: { character: Character })
{
  const dispatch = useDispatch()

  const handleViewClick = () => 
  {
    dispatch(actions.clearCharacterNavbarSearch());
  };

  return (
    <Card className='bg-muted'>
      
      <CardHeader className='-my-1.5'>
        <CardTitle className='text-2xl flex justify-between'>
            {character.name}

            <Button asChild size="sm" className='mt-0.5' onClick={handleViewClick}>
                <Link href={`/characters/${character.id}`}>view</Link>
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