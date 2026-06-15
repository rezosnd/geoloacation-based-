import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeLocations } from '@/lib/locationNormalization';
import { geocodeAddresses } from '@/lib/geocoding';

export async function POST(request: Request) {
  try {
    const { records } = await request.json();

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Normalize Locations
    const rawVillages = records.map((r: any) => r.village).filter(Boolean);
    const rawDistricts = records.map((r: any) => r.district).filter(Boolean);
    const locationMapping = await normalizeLocations([...rawVillages, ...rawDistricts]);

    for (const r of records) {
      if (r.village) r.village = locationMapping.get(r.village) || r.village;
      if (r.district) r.district = locationMapping.get(r.district) || r.district;
    }

    // 2. Geocode Addresses
    const geocodedRecords = await geocodeAddresses(records);

    // 3. Bulk Insert using Prisma and Raw Query for PostGIS Geography
    // Since we need to insert `geography_point`, we'll do it via raw query
    let valuesClause = [];
    
    // We will use standard parameterization to avoid SQL injection, but for batch inserts
    // building large raw queries with parameters is tricky. Another approach is to use prisma createMany
    // and then update points, but that's two operations.
    // Let's do an unnest approach or multiple single queries within a transaction, or just build the string
    // if we trust the sanitized input, but we don't.
    // Instead, we will do Prisma $executeRawUnsafe with placeholders for a single bulk insert.
    
    // Better yet, just insert using Prisma createMany for normal fields,
    // then run an update to set geography_point where latitude/longitude are not null.
    // This is safer and easier.

    const insertData = geocodedRecords.map((r) => ({
      customer_name: r.customer_name || null,
      mobile_number: r.mobile_number || null,
      dealer_name: r.dealer_name || null,
      dealer_code: r.dealer_code || null,
      address: r.address || null,
      village: r.village || null,
      district: r.district || null,
      state: r.state || null,
      pincode: r.pincode || null,
      bike_model: r.bike_model || null,
      invoice_amount: r.invoice_amount ? parseFloat(r.invoice_amount) : null,
      purchase_date: r.purchase_date ? new Date(r.purchase_date) : null,
      latitude: r.latitude || null,
      longitude: r.longitude || null,
    }));

    await prisma.customer.createMany({
      data: insertData,
    });

    // Update PostGIS points for the new records (we can just update all where geography_point is null)
    await prisma.$executeRaw`
      UPDATE "Customer"
      SET geography_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geography_point IS NULL;
    `;

    return NextResponse.json({ message: 'Batch uploaded successfully', count: records.length });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
