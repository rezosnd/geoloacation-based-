import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';

  const skip = (page - 1) * limit;

  try {
    const whereClause = search ? {
      OR: [
        { customer_name: { contains: search, mode: 'insensitive' as any } },
        { mobile_number: { contains: search, mode: 'insensitive' as any } },
        { village: { contains: search, mode: 'insensitive' as any } },
        { dealer_name: { contains: search, mode: 'insensitive' as any } },
      ]
    } : {};

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { purchase_date: 'desc' }
      }),
      prisma.customer.count({ where: whereClause })
    ]);

    return NextResponse.json({
      customers,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error: any) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
