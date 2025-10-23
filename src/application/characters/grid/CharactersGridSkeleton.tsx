"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/pagination";

import { Separator } from '@/ui/separator';
import { Skeleton } from '@/ui/skeleton';

export default function CharactersGridSkeleton()
{
  return (
    <>
      <Pagination className='flex justify-center mt-4'>

        <PaginationContent>
          
          <PaginationItem>
            <PaginationPrevious href="#"/>
          </PaginationItem>
          
          {
            Array.from({ length: 3 }, (_, i) => i + 1).map(pageNumber => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={false}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext href="#"/>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className='grid lg:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 m-4'>
      {
        Array.from({ length: 12 }).map((_, index) => (
          <Card className='bg-muted' key={index}>
            <CardHeader className='-my-1.5'>
              <CardTitle className='text-2xl flex justify-between'>
                <Skeleton className='h-2 w-1/2 ' />
              </CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className='-mt-1'>
              <CardDescription className='text-justify'>
                <Skeleton className='h-20 w-full' />
              </CardDescription>
            </CardContent>
          </Card>
        ))
      }
      </div>
    </>
  );
}