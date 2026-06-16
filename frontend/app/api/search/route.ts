import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseFloat(searchParams.get('radius') || '10');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const radiusMeters = radius * 1000;

  try {
    // We use a raw query for ST_DWithin and ST_Distance using geography
    const customers = (await prisma.$queryRaw`
      SELECT 
        id, 
        customer_name, 
        mobile_number, 
        address, 
        village, 
        district, 
        dealer_name, 
        dealer_code, 
        bike_model, 
        purchase_date, 
        invoice_amount, 
        latitude, 
        longitude,
        ST_Distance(geography_point, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1000 AS distance
      FROM "Customer"
      WHERE geography_point IS NOT NULL
        AND ST_DWithin(
          geography_point,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance ASC;
    `) as any[];

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
