import axios from 'axios';
import { prisma } from './prisma';

// Utility to sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function geocodeAddresses(records: any[]): Promise<any[]> {
  const uniqueAddresses = new Map<string, { lat: number | null; lng: number | null }>();

  for (const record of records) {
    // OPTIMIZATION: Geocode ONLY at the Village + District level. 
    // Out of 20,000 customers, there are usually only a few hundred villages.
    // This allows us to skip 99% of API calls by caching the coordinates of the village!
    const addressKey = `${record.village || ''}, ${record.district || ''}, ${record.state || ''}`.toLowerCase().trim();
    
    if (uniqueAddresses.has(addressKey)) {
      const cached = uniqueAddresses.get(addressKey);
      record.latitude = cached?.lat || null;
      record.longitude = cached?.lng || null;
      continue;
    }

    const existing = await prisma.customer.findFirst({
      where: {
        village: record.village,
        district: record.district,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: { latitude: true, longitude: true },
    });

    if (existing && existing.latitude && existing.longitude) {
      uniqueAddresses.set(addressKey, { lat: existing.latitude, lng: existing.longitude });
      record.latitude = existing.latitude;
      record.longitude = existing.longitude;
      continue;
    }

    // Geocoding logic
    let retries = 3;
    while (retries > 0) {
      try {
        const query = addressKey.replace(/,\s*,/g, ',').trim();
        
        // Use Google Maps if key exists (Lightning Fast, no rate limits)
        if (process.env.GOOGLE_MAPS_API_KEY) {
           const geoRes = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
             params: { address: query, key: process.env.GOOGLE_MAPS_API_KEY }
           });
           if (geoRes.data.results && geoRes.data.results.length > 0) {
             const loc = geoRes.data.results[0].geometry.location;
             record.latitude = loc.lat;
             record.longitude = loc.lng;
           } else {
             record.latitude = null;
             record.longitude = null;
           }
           uniqueAddresses.set(addressKey, { lat: record.latitude, lng: record.longitude });
           break; // Success
        }

        // Fallback to Free APIs (Photon and Nominatim) with Location Degradation
        // 1. Better matching: We use Photon API first (better fuzzy matching).
        // 2. Degradation: If Village is not found, we fallback to District, then State to ensure we at least get a map point.
        const queries = [
          query, // Level 1: Village, District, State
          `${record.district || ''}, ${record.state || ''}`.replace(/,\s*,/g, ',').trim(), // Level 2: District, State
          `${record.state || ''}`.replace(/,\s*,/g, ',').trim() // Level 3: State only
        ].filter(q => q.length > 2);

        let foundLocation: {lat: number, lng: number} | null = null;

        for (let i = 0; i < queries.length; i++) {
          const q = queries[i];
          
          // 1. Try Free Photon API (Better fuzzy matching, open source)
          try {
            const photonRes = await axios.get(`https://photon.komoot.io/api/`, {
              params: { q: q, limit: 1 }
            });
            if (photonRes.data?.features?.length > 0) {
              const coords = photonRes.data.features[0].geometry.coordinates; // Photon returns [lon, lat]
              foundLocation = { lat: coords[1], lng: coords[0] };
              break; // Found it!
            }
          } catch (e: any) {
            console.warn(`Photon API error for query "${q}":`, e.message);
          }

          // 2. Try Nominatim (OSM) as backup
          const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: q, format: 'json', limit: 1, countrycodes: 'in' },
            headers: {
              'User-Agent': 'VeritasCoRadiusIntelligence/1.0',
              'Referer': 'https://veritasco.com',
              'Accept-Language': 'en-US,en;q=0.9',
            }
          });

          if (response.data && response.data.length > 0) {
            const location = response.data[0];
            foundLocation = { lat: parseFloat(location.lat), lng: parseFloat(location.lon) };
            break; // Found it!
          }
          
          if (i < queries.length - 1) {
             await sleep(1000); // Sleep slightly before next query to respect limits
          }
        }

        if (foundLocation) {
          record.latitude = foundLocation.lat;
          record.longitude = foundLocation.lng;
          uniqueAddresses.set(addressKey, { lat: record.latitude, lng: record.longitude });
        } else {
          record.latitude = null;
          record.longitude = null;
          uniqueAddresses.set(addressKey, { lat: null, lng: null });
        }
        
        await sleep(1500); // Respect rate limit for next record
        break; // Success


      } catch (error: any) {
        if (error.response && error.response.status === 429) {
          console.warn('Geocoding rate limited (429). Retrying in 5 seconds...');
          retries--;
          await sleep(5000); // 5 second backoff
          if (retries === 0) {
            record.latitude = null;
            record.longitude = null;
            uniqueAddresses.set(addressKey, { lat: null, lng: null });
          }
        } else {
          console.error('Geocoding error:', error.message);
          record.latitude = null;
          record.longitude = null;
          uniqueAddresses.set(addressKey, { lat: null, lng: null });
          await sleep(2000);
          break; // Exit retry loop for other errors
        }
      }
    }
  }

  return records;
}
