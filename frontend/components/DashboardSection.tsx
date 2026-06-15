'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, IndianRupee, MapPin, Bike } from 'lucide-react';

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
    return <div className="clean-card h-[60vh] flex items-center justify-center text-xl text-neutral-400">Loading Analytics...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Customers', value: data.totalCustomers.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { title: 'Total Sales Revenue', value: `₹${(data.totalSales).toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { title: 'Top District', value: data.topDistricts[0]?.name || '-', icon: MapPin, color: 'text-purple-500', bg: 'bg-purple-50' },
          { title: 'Top Bike Model', value: data.topModels[0]?.name || '-', icon: Bike, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="clean-card p-6 flex items-center space-x-5">
            <div className={`p-4 rounded-2xl ${stat.bg}`}>
              <stat.icon size={28} className={stat.color} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Area */}
        <div className="clean-card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Revenue by Area</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByArea} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 13 }} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="revenue" fill="#171717" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Bike Models */}
        <div className="clean-card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Top Bike Models</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.topModels} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} stroke="none" label>
                  {data.topModels.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
