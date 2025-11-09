import { NextResponse } from 'next/server';
// import { seedEquipment } from '../../../../../prisma/seeds/equipmentSeed';

export async function POST()
{
  try 
  {
    // await seedEquipment()
    return NextResponse.json({ message: 'Equipment seeded successfully' }, { status: 200 });
  } 
  catch 
  {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};