import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { geocodeAddresses } from '@/lib/geocoding';

export async function POST(request: Request) {
  try {
    const { originalName, correctedName } = await request.json();

    if (!originalName || !correctedName) {
      return NextResponse.json({ error: 'Missing originalName or correctedName' }, { status: 400 });
    }

    const cleanOriginal = originalName.trim().toLowerCase();
    const titleCaseCorrected = correctedName.trim().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // 1. Update or Create in Location Dictionary
    await prisma.locationDictionary.upsert({
      where: { original_name: cleanOriginal },
      update: { corrected_name: titleCaseCorrected },
      create: { original_name: cleanOriginal, corrected_name: titleCaseCorrected, confidence_score: 1.0 },
    });

    // 2. Find all customers with the old name
    const affectedCustomers = await prisma.customer.findMany({
      where: {
        village: { equals: cleanOriginal, mode: 'insensitive' }
      }
    });

    let updatedCount = 0;

    // 3. Update their names and re-geocode them if necessary
    if (affectedCustomers.length > 0) {
      // Update name first
      await prisma.customer.updateMany({
        where: { village: { equals: cleanOriginal, mode: 'insensitive' } },
        data: { village: titleCaseCorrected }
      });

      // Get one record to re-geocode to find the accurate coordinates for the new name
      const sampleToGeocode = {
        id: affectedCustomers[0].id,
        village: titleCaseCorrected,
        district: affectedCustomers[0].district,
        state: affectedCustomers[0].state,
        latitude: null,
        longitude: null,
      };

      const [geocoded] = await geocodeAddresses([sampleToGeocode]);

      if (geocoded.latitude && geocoded.longitude) {
        // Update all affected customers with the correct coordinates and geography point
        await prisma.$executeRaw`
          UPDATE "Customer"
          SET 
            latitude = ${geocoded.latitude},
            longitude = ${geocoded.longitude},
            geography_point = ST_SetSRID(ST_MakePoint(${geocoded.longitude}, ${geocoded.latitude}), 4326)::geography
          WHERE village = ${titleCaseCorrected} AND (latitude IS NULL OR longitude != ${geocoded.longitude});
        `;
      }
      updatedCount = affectedCustomers.length;
    }

    return NextResponse.json({ 
      message: 'Alias created successfully.', 
      original: cleanOriginal, 
      corrected: titleCaseCorrected,
      customersUpdated: updatedCount
    });

  } catch (error: any) {
    console.error('Alias Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
