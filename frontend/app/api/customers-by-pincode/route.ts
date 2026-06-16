import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode');

  if (!pincode) {
    return NextResponse.json({ error: 'Missing pincode' }, { status: 400 });
  }

  try {
    const customers = await prisma.customer.findMany({
      where: {
        pincode: pincode
      },
      orderBy: {
        customer_name: 'asc'
      }
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Fetch customers by pincode error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
