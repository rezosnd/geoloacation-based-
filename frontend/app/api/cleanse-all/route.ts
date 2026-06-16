import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    // 1. Get all distinct pincodes in the database
    const uniquePincodes = await prisma.$queryRaw`
      SELECT DISTINCT pincode 
      FROM "Customer" 
      WHERE pincode IS NOT NULL AND pincode != ''
    ` as any[];

    let totalUpdated = 0;
    let failedPincodes = [];
    let processedPincodes = 0;

    // 2. Loop through every pincode and apply the cleansing logic
    for (const pinObj of uniquePincodes) {
      const pincode = pinObj.pincode;
      processedPincodes++;

      try {
        const postalRes = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
        if (!postalRes.data || !postalRes.data[0] || postalRes.data[0].Status !== 'Success') {
          failedPincodes.push(pincode);
          continue;
        }

        const postOffices = postalRes.data[0].PostOffice;
        const officialDistrict = postOffices[0].District;
        const officialState = postOffices[0].State;

        const customers = await prisma.customer.findMany({
          where: { pincode: pincode }
        });

        for (const cust of customers) {
          const addrStr = (cust.address || '').toLowerCase() + ' ' + (cust.village || '').toLowerCase();
          let matchedVillage = null;

          for (const po of postOffices) {
            const poName = po.Name.toLowerCase();
            // Try strict and slightly loose match to find the short village name
            if (addrStr.includes(poName) || addrStr.includes(poName.replace(/\s+/g, ''))) {
              matchedVillage = po.Name; 
              break;
            }
          }

          const newVillage = matchedVillage || cust.village; 
          
          await prisma.customer.update({
            where: { id: cust.id },
            data: {
              village: newVillage,
              district: officialDistrict,
              state: officialState
            }
          });
          
          totalUpdated++;
        }
      } catch (err) {
        failedPincodes.push(pincode);
      }
      
      // Delay slightly to prevent rate limiting from postal API
      await new Promise(r => setTimeout(r, 200)); 
    }

    return NextResponse.json({ 
      success: true, 
      totalUpdated,
      processedPincodes,
      failedPincodes
    });

  } catch (error: any) {
    console.error('Cleanse all error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
