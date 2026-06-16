import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pincodes = (await prisma.$queryRaw`
      SELECT 
        pincode, 
        MAX(district) as location, 
        COUNT(*)::int as count 
      FROM "Customer" 
      WHERE pincode IS NOT NULL AND pincode != ''
      GROUP BY pincode 
      ORDER BY count DESC
    `) as any[];

    return NextResponse.json(pincodes);
  } catch (error: any) {
    console.error('Fetch pincodes error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
