import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode');
  const query = searchParams.get('query');

  try {
    let villages: any[] = [];

    if (pincode) {
      villages = await prisma.$queryRaw<any[]>`
        SELECT village, district, pincode, COUNT(*)::int as count 
        FROM "Customer" 
        WHERE pincode = ${pincode} AND village IS NOT NULL
        GROUP BY village, district, pincode 
        ORDER BY count DESC
      `;
    } else if (query) {
      const wildcard = `%${query}%`;
      villages = await prisma.$queryRaw<any[]>`
        SELECT village, district, pincode, COUNT(*)::int as count 
        FROM "Customer" 
        WHERE village ILIKE ${wildcard} AND village IS NOT NULL
        GROUP BY village, district, pincode 
        ORDER BY count DESC
        LIMIT 20
      `;
    }

    return NextResponse.json(villages);
  } catch (error: any) {
    console.error('Village search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
