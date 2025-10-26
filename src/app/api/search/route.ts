import { type NextRequest, NextResponse } from 'next/server';
import { searchEntity } from "@/persistence/searchEntity";
import { type SearchEntityPayload } from '@/common/global/SearchPayload';

export async function POST(request: NextRequest)
{
  const searchEntityPayload: SearchEntityPayload = await request.json();

  try 
  {
    const characters = await searchEntity(searchEntityPayload);
    return NextResponse.json(characters);
  } 
  catch (error) 
  {
    console.error(`Error fetching: ${searchEntityPayload.entity}`, error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};