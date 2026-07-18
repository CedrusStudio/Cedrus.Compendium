import { type NextRequest, NextResponse } from 'next/server';
import { searchEntity } from "@/persistence/searchEntity";
import { isAllowedSearchEntity, type SearchEntityPayload } from '@/common/global/SearchPayloads';
import { API_KEY_HEADER } from '@/proxy';

export async function POST(request: NextRequest)
{
  const searchEntityPayload: SearchEntityPayload = await request.json();

  if (!isAllowedSearchEntity(searchEntityPayload.entity))
  {
    return NextResponse.json({ message: 'Entity is missing or invalid' }, { status: 400 });
  }

  try
  {
    const apiKey = request.headers.get(API_KEY_HEADER);
    const characters = await searchEntity(searchEntityPayload, apiKey);
    return NextResponse.json(characters);
  }
  catch (error) 
  {
    console.error(`Error fetching: ${searchEntityPayload.entity}`, error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};