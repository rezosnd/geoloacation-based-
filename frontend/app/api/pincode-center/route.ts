import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode');

  if (!pincode) {
    return NextResponse.json({ error: 'Missing pincode' }, { status: 400 });
  }

  try {
    // Find the exact coordinate where the highest density of customers live in this pincode.
    // By picking the exact cluster coordinate, a 1km radius will instantly capture them
    // because their distance from this exact center will be 0.0km.
    const result = await prisma.$queryRaw`
      SELECT 
        latitude as lat, 
        longitude as lng 
      FROM "Customer" 
      WHERE pincode = ${pincode} 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
      GROUP BY latitude, longitude
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ` as any[];

    if (result && result.length > 0 && result[0].lat !== null) {
      return NextResponse.json({ lat: result[0].lat, lng: result[0].lng });
    }

    return NextResponse.json({ error: 'No customers found with this pincode' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
