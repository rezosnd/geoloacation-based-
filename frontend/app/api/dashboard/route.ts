import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();
    
    const salesAggregate = await prisma.customer.aggregate({
      _sum: {
        invoice_amount: true,
      },
    });
    const totalSales = salesAggregate._sum.invoice_amount || 0;

    const topVillages = await prisma.customer.groupBy({
      by: ['village'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topDistricts = await prisma.customer.groupBy({
      by: ['district'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topModels = await prisma.customer.groupBy({
      by: ['bike_model'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const revenueByArea = await prisma.customer.groupBy({
      by: ['district'],
      _sum: { invoice_amount: true },
      orderBy: { _sum: { invoice_amount: 'desc' } },
      take: 5,
    });

    return NextResponse.json({
      totalCustomers,
      totalSales,
      topVillages: topVillages.map(v => ({ name: v.village || 'Unknown', count: v._count.id })),
      topDistricts: topDistricts.map(d => ({ name: d.district || 'Unknown', count: d._count.id })),
      topModels: topModels.map(m => ({ name: m.bike_model || 'Unknown', count: m._count.id })),
      revenueByArea: revenueByArea.map(r => ({ name: r.district || 'Unknown', revenue: r._sum.invoice_amount || 0 })),
    });
  } catch (error: any) {
    console.error('Dashboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
