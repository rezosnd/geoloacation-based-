const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function reprocessFailedLocations() {
  console.log('Fetching customers with missing coordinates...');
  
  // Find all customers that currently have null coordinates
  const failedCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null }
      ]
    },
    select: {
      id: true,
      village: true,
      district: true,
      state: true
    }
  });

  console.log(`Found ${failedCustomers.length} records to reprocess. This will use the new advanced AI-fuzzy matching (Photon).`);

  if (failedCustomers.length === 0) {
    console.log('No records need fixing!');
    return;
  }

  let successCount = 0;
  let fallbackCount = 0;

  for (let i = 0; i < failedCustomers.length; i++) {
    const record = failedCustomers[i];
    
    // Build queries with degradation (Village -> District -> State)
    const queryBase = `${record.village || ''}, ${record.district || ''}, ${record.state || ''}`.toLowerCase().trim();
    const queries = [
      queryBase.replace(/,\s*,/g, ',').trim(),
      `${record.district || ''}, ${record.state || ''}`.replace(/,\s*,/g, ',').trim(),
      `${record.state || ''}`.replace(/,\s*,/g, ',').trim()
    ].filter(q => q.length > 2);

    let foundLocation = null;
    let usedFallback = false;

    for (let j = 0; j < queries.length; j++) {
      const q = queries[j];
      
      try {
        // Try Photon API (Excellent for fuzzy typos like 'zerry')
        const photonRes = await axios.get(`https://photon.komoot.io/api/`, {
          params: { q: q, limit: 1 }
        });
        
        if (photonRes.data && photonRes.data.features && photonRes.data.features.length > 0) {
          const coords = photonRes.data.features[0].geometry.coordinates; // [lon, lat]
          foundLocation = { lat: coords[1], lng: coords[0] };
          if (j > 0) usedFallback = true;
          break;
        }
      } catch (e) {
        // ignore
      }

      // If Photon fails, try Nominatim
      try {
        const nomRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: { q: q, format: 'json', limit: 1, countrycodes: 'in' },
          headers: {
            'User-Agent': 'VeritasCoRadiusIntelligence/1.0',
            'Referer': 'https://veritasco.com',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        
        if (nomRes.data && nomRes.data.length > 0) {
          foundLocation = { lat: parseFloat(nomRes.data[0].lat), lng: parseFloat(nomRes.data[0].lon) };
          if (j > 0) usedFallback = true;
          break;
        }
      } catch (e) {
        if (e.response && e.response.status === 429) {
           await sleep(5000); // Backoff on rate limit
        }
      }
      
      await sleep(1000); // Sleep slightly to respect limits
    }

    if (foundLocation) {
      // Update the database with the new coordinates
      await prisma.$executeRaw`
        UPDATE "Customer"
        SET 
          latitude = ${foundLocation.lat},
          longitude = ${foundLocation.lng},
          geography_point = ST_SetSRID(ST_MakePoint(${foundLocation.lng}, ${foundLocation.lat}), 4326)::geography
        WHERE id = ${record.id};
      `;
      
      successCount++;
      if (usedFallback) fallbackCount++;
      
      if (successCount % 50 === 0) {
        console.log(`Processed ${successCount}/${failedCustomers.length}...`);
      }
    }
    
    // Give the free APIs a tiny rest
    await sleep(1000);
  }

  console.log('--------------------------------------------------');
  console.log(`Reprocessing Complete!`);
  console.log(`Total fixed: ${successCount}`);
  console.log(`Matched via fallback (District/State): ${fallbackCount}`);
  console.log('--------------------------------------------------');
}

reprocessFailedLocations().catch(console.error).finally(() => prisma.$disconnect());
