import axios from 'axios';
import Fuse from 'fuse.js';

// Cache pincode results so we don't spam the API for the same pincode
const pincodeCache = new Map<string, string[]>();

export async function normalizeWithPincode(village: string, pincode: string): Promise<string> {
  if (!pincode || !village || village.length < 2) return village;

  try {
    let validVillages: string[] = [];

    // Check cache first
    if (pincodeCache.has(pincode)) {
      validVillages = pincodeCache.get(pincode) || [];
    } else {
      // Fetch from Official Government API
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = response.data[0];

      if (data.Status === 'Success' && data.PostOffice) {
        validVillages = data.PostOffice.map((po: any) => po.Name);
        pincodeCache.set(pincode, validVillages);
      } else {
        pincodeCache.set(pincode, []); // Cache the failure so we don't retry
      }
    }

    if (validVillages.length > 0) {
      // Use Fuse.js to find the closest official spelling within this specific pincode
      const fuse = new Fuse(validVillages, { includeScore: true, threshold: 0.6 });
      const results = fuse.search(village);

      if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.5) {
        // We found a highly likely match in the official postal records!
        return results[0].item;
      }
    }
  } catch (error) {
    console.warn(`Pincode API failed for ${pincode}:`, error);
  }

  // If all fails, return the original string
  return village;
}
