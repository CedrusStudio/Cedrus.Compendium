import { NextResponse } from 'next/server';
// import { seedCharacter } from '../../../../../../prisma/seeds/characterSeed';

export async function POST()
{
  try 
  {
    // await seedCharacter()
    return NextResponse.json({ message: 'Character seeded successfully' }, { status: 200 });
  } 
  catch 
  {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};