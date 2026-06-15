import Fuse from 'fuse.js';
import { prisma } from './prisma';

export async function normalizeLocations(locations: string[]): Promise<Map<string, string>> {
  // Fetch existing dictionary
  const dictionaryRecords = await prisma.locationDictionary.findMany();
  const dictionary = dictionaryRecords.map((r) => ({
    original: r.original_name,
    corrected: r.corrected_name,
  }));

  const fuse = new Fuse(dictionary, {
    keys: ['original', 'corrected'],
    threshold: 0.3,
  });

  const mapping = new Map<string, string>();
  const newEntries: { original: string; corrected: string }[] = [];

  for (const loc of locations) {
    if (!loc) continue;
    const cleanLoc = loc.trim().toLowerCase();
    
    // Exact match in dictionary?
    const exactMatch = dictionary.find((d) => d.original.toLowerCase() === cleanLoc);
    if (exactMatch) {
      mapping.set(loc, exactMatch.corrected);
      continue;
    }

    // Fuzzy match
    const result = fuse.search(cleanLoc);
    if (result.length > 0 && result[0].score && result[0].score < 0.3) {
      mapping.set(loc, result[0].item.corrected);
      // Still store this new variant pointing to the corrected name
      newEntries.push({ original: cleanLoc, corrected: result[0].item.corrected });
    } else {
      // It's a new location, store as its own corrected name initially
      const titleCaseLoc = cleanLoc.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      mapping.set(loc, titleCaseLoc);
      newEntries.push({ original: cleanLoc, corrected: titleCaseLoc });
      
      // Add to current fuse index so subsequent matches in the same batch can find it
      dictionary.push({ original: cleanLoc, corrected: titleCaseLoc });
      fuse.add({ original: cleanLoc, corrected: titleCaseLoc });
    }
  }

  // Bulk insert new dictionary entries (ignore duplicates)
  if (newEntries.length > 0) {
    try {
      await prisma.locationDictionary.createMany({
        data: newEntries.map(e => ({
          original_name: e.original,
          corrected_name: e.corrected,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error saving new location dictionary entries', error);
    }
  }

  return mapping;
}
