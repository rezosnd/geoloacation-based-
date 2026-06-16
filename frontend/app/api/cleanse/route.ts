import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pincode } = body;

    if (!pincode) {
      return NextResponse.json({ error: 'Pincode required' }, { status: 400 });
    }

    // 1. Fetch Official Postal Data
    const postalRes = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!postalRes.data || !postalRes.data[0] || postalRes.data[0].Status !== 'Success') {
      return NextResponse.json({ error: 'Could not fetch official data for this pincode from Postal API.' }, { status: 404 });
    }

    const postOffices = postalRes.data[0].PostOffice;
    const officialDistrict = postOffices[0].District;
    const officialState = postOffices[0].State;
    const officialDivision = postOffices[0].Division;

    // 2. Fetch customers in this pincode
    const customers = await prisma.customer.findMany({
      where: { pincode: pincode }
    });

    // 3. Auto-correct each customer
    const updates = [];

    for (const cust of customers) {
      const addrStr = (cust.address || '').toLowerCase() + ' ' + (cust.village || '').toLowerCase();
      
      let matchedVillage = null;

      // Find the best matching official village name inside their raw address string
      for (const po of postOffices) {
        const poName = po.Name.toLowerCase();
        // Check if the address contains the village name (e.g., 'bharwara')
        if (addrStr.includes(poName) || addrStr.includes(poName.replace(/\s+/g, ''))) {
          matchedVillage = po.Name; // Use the perfect Official capitalized spelling
          break;
        }
      }

      // If we found a match, or even if we didn't but want to fix district/state
      const newVillage = matchedVillage || cust.village; // Keep old if no match found
      
      updates.push(
        prisma.customer.update({
          where: { id: cust.id },
          data: {
            village: newVillage,
            district: officialDistrict, // 100% correct spelling from API
            state: officialState,       // 100% correct spelling from API
          }
        })
      );
    }

    // Execute all updates in parallel inside a transaction for massive speed boost
    await prisma.$transaction(updates);
    let updatedCount = updates.length;

    return NextResponse.json({ 
      success: true, 
      updatedCount, 
      officialDistrict, 
      officialState,
      villagesDetected: postOffices.map((p: any) => p.Name)
    });

  } catch (error: any) {
    console.error('Cleanse error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
