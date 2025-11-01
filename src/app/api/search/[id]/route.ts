import { type NextRequest, NextResponse } from 'next/server';
import { searchEntityById } from "@/persistence/searchEntity";
import { isAllowedSearchEntity, type SearchByIdEntityPayload } from '@/common/global/SearchPayloads';

type RouteParams = Promise<{ id: string }>

export async function POST(request: NextRequest, segmentData: { params: RouteParams })
{
  const { id } = await segmentData.params;
  const searchEntityPayload: SearchByIdEntityPayload = await request.json();

  if (!isAllowedSearchEntity(searchEntityPayload.entity))
  {
    return NextResponse.json({ message: 'Entity is missing or invalid' }, { status: 400 });
  }

  try 
  {
    const characters = await searchEntityById(id, searchEntityPayload);
    return NextResponse.json(characters);
  } 
  catch (error) 
  {
    console.error(`Error fetching: ${searchEntityPayload.entity}`, error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};