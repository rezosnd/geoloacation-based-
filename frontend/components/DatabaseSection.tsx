'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ChevronLeft, ChevronRight, Users, Phone, MapPin, Tag, Calendar } from 'lucide-react';

export default function DatabaseSection() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = async (currentPage = 1, query = '') => {
    setLoading(true);
    try {
      const res = await axios.get('/api/customers', {
        params: { page: currentPage, limit: 50, search: query }
      });
      setCustomers(res.data.customers);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers(page, searchQuery);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(1, searchQuery);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white border border-neutral-100 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Customer Database</h2>
          <p className="text-sm text-neutral-500 font-medium mt-1">Total Records: {totalCount.toLocaleString()}</p>
        </div>
        
        <form onSubmit={handleSearch} className="w-full md:w-[400px] relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, mobile, village, dealer..." 
            className="w-full bg-neutral-50 border border-neutral-200 rounded-[16px] px-5 py-4 pl-12 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all font-medium placeholder:font-normal"
          />
          <Search className="absolute left-4 top-[18px] text-neutral-400" size={20} />
          <button type="submit" className="absolute right-2 top-2 bg-neutral-900 text-white p-2 rounded-[10px] hover:bg-neutral-800 transition-colors">
            <Search size={16} />
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[24px] border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#fafafa] border-b border-neutral-100 text-neutral-500 uppercase tracking-wider font-semibold text-xs">
              <tr>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><Users size={14} /> Customer</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><Phone size={14} /> Contact</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><MapPin size={14} /> Location</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><Tag size={14} /> Bike Model</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><Calendar size={14} /> Purchase Date</div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-neutral-400">
                    <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4"></div>
                    Loading customer data...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-neutral-400">
                    <Users size={32} className="mx-auto mb-4 opacity-50" />
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-neutral-900">{c.customer_name || 'Unknown'}</td>
                    <td className="px-6 py-4 font-medium text-neutral-600">{c.mobile_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-neutral-600">{c.village}, {c.district}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md">
                        {c.bike_model || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 font-medium">
                      {c.purchase_date ? new Date(c.purchase_date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 0 && (
          <div className="border-t border-neutral-100 p-4 bg-white flex items-center justify-between">
            <span className="text-sm text-neutral-500 font-medium">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} className="text-neutral-700" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} className="text-neutral-700" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
