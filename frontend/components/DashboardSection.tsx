'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconRupee = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13h8.5a4.5 4.5 0 0 0 0-9" />
    <path d="M14.5 13L6 21" />
  </svg>
);

const IconMapPin = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconBike = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
  </svg>
);

export default function DashboardSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-500">
        <p className="font-medium text-sm">Loading analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Customers', value: data.totalCustomers.toLocaleString(), icon: IconUsers },
          { title: 'Total Revenue', value: `₹${(data.totalSales).toLocaleString()}`, icon: IconRupee },
          { title: 'Top District', value: data.topDistricts[0]?.name || '-', icon: IconMapPin },
          { title: 'Top Model', value: data.topModels[0]?.name || '-', icon: IconBike },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-5 flex items-center space-x-4">
            <div className="p-3 bg-gray-50 rounded-full border border-gray-100">
              <stat.icon />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-500 mb-0.5 truncate">{stat.title}</p>
              <p className="text-xl font-semibold text-gray-900 truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Area */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">Revenue by Region</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByArea} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px' }} />
                <Bar dataKey="revenue" fill="#171717" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Bike Models */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">Top Models</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.topModels} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} stroke="#ffffff" strokeWidth={3} label={{ fill: '#52525b', fontSize: 12 }}>
                  {data.topModels.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#171717', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
