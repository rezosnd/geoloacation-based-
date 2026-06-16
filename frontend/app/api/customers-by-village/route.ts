import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { villages } = body;

    if (!villages || !Array.isArray(villages) || villages.length === 0) {
      return NextResponse.json({ error: 'Missing villages array' }, { status: 400 });
    }

    const customers = await prisma.customer.findMany({
      where: {
        village: {
          in: villages
        }
      },
      orderBy: {
        customer_name: 'asc'
      }
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Fetch customers by village error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
