'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const IconSearch = ({ size = 20 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconMapPin = ({ size = 20, className = "" }: { size?: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const IconNavigation = ({ size = 20, className = "" }: { size?: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>;
const IconSpreadsheet = ({ size = 20, className = "" }: { size?: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2"></path><path d="M8 17h2"></path><path d="M14 13h2"></path><path d="M14 17h2"></path></svg>;
const IconFileText = ({ size = 20, className = "" }: { size?: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconMap = ({ size = 20, className = "" }: { size?: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>;

const LeafletMap = dynamic(() => import('./LeafletMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 font-medium text-sm border border-gray-100 rounded-lg">Loading Map Engine...</div>
});

export default function MapSection() {
  const [center, setCenter] = useState({ lat: 26.1542, lng: 85.8918 }); 
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);

    try {
      let loc = null;

      if (/^\d{6}$/.test(searchQuery.trim())) {
        try {
          const pinRes = await axios.get('/api/pincode-center', { 
            params: { pincode: searchQuery.trim() } 
          });
          if (pinRes.data && pinRes.data.lat) {
            loc = { lat: parseFloat(pinRes.data.lat), lng: parseFloat(pinRes.data.lng) };
          }
        } catch (e) {
          console.log("Pincode not found in DB, falling back to OSM.");
        }
      }

      if (!loc) {
        const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: { q: searchQuery, format: 'json', limit: 1, countrycodes: 'in' }
        });
        if (geoRes.data && geoRes.data.length > 0) {
          loc = { lat: parseFloat(geoRes.data[0].lat), lng: parseFloat(geoRes.data[0].lon) };
        }
      }

      if (loc) {
        setCenter(loc);
        const custRes = await axios.get('/api/search', {
          params: { lat: loc.lat, lng: loc.lng, radius: radius }
        });
        setCustomers(custRes.data);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error(err);
      alert("Search failed.");
    }
    setLoading(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(customers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "Radius_Results.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setTextColor(23, 23, 23);
    doc.text(`VeritasCo Radius Report`, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(115, 115, 115);
    doc.text(`Search Origin: ${searchQuery || 'Custom'} | Radius: ${radius}km | Results: ${customers.length}`, 14, 30);

    const tableData = customers.map(c => [
      c.customer_name || 'N/A',
      c.mobile_number || 'N/A',
      `${c.village || ''}, ${c.district || ''}`.replace(/^,\s*/, ''),
      c.bike_model || 'N/A',
      c.dealer_name || 'N/A',
      c.distance ? `${c.distance.toFixed(2)} km` : 'N/A'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Name', 'Mobile', 'Location', 'Model', 'Dealer', 'Distance']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3, textColor: 50, lineColor: 200, lineWidth: 0.1 },
      alternateRowStyles: { fillColor: [250, 250, 250] }
    });

    doc.save(`Radius_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="glass-panel p-5 sm:p-6 flex flex-col xl:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Search Origin</label>
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Darbhanga or 847303"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="absolute left-3.5 top-[11px] text-gray-400">
              <IconMapPin size={18} />
            </div>
          </div>
        </div>
        
        <div className="w-full xl:w-48 relative">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Radius</label>
          <div className="relative">
            <select 
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none cursor-pointer"
            >
              {[1, 5, 10, 15, 20, 25, 50, 100].map(r => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
            <div className="absolute right-3.5 top-[11px] text-gray-400 pointer-events-none">
              <IconNavigation size={16} />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg h-[42px] px-6 text-sm font-medium transition-colors flex items-center justify-center space-x-2 shrink-0 shadow-sm"
        >
          {loading ? <span>Searching...</span> : <IconSearch size={16} />}
          {!loading && <span>Search</span>}
        </button>

        {customers.length > 0 && (
          <div className="flex gap-2">
            <button onClick={exportExcel} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg h-[42px] px-4 text-sm font-medium transition-colors flex items-center space-x-2 shadow-sm">
              <IconSpreadsheet size={16} className="text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={exportPDF} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg h-[42px] px-4 text-sm font-medium transition-colors flex items-center space-x-2 shadow-sm">
              <IconFileText size={16} className="text-red-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[700px]">
        {/* Map Area */}
        <div className="xl:col-span-2 glass-panel p-2 relative z-0">
          <LeafletMap 
            center={center} 
            radius={radius} 
            customers={customers} 
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
          />
        </div>

        {/* Results Sidebar */}
        <div className="glass-panel flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white z-10 shrink-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-base font-semibold text-gray-900">Results</h3>
              <div className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md">{customers.length} found</div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Ordered by nearest proximity</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {customers.map((c, i) => (
              <div 
                key={i} 
                className={`bg-white p-4 rounded-xl border transition-colors cursor-pointer ${selectedCustomer?.id === c.id ? 'border-gray-900 ring-1 ring-gray-900 shadow-sm' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}
                onClick={() => {
                  setCenter({ lat: c.latitude, lng: c.longitude });
                  setSelectedCustomer(c);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{c.customer_name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{c.mobile_number}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{c.distance?.toFixed(1)} km</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-1.5 text-xs">
                    <IconMap size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600 leading-tight">{c.village}, {c.district}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-50">
                    <span className="inline-flex items-center text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded">
                      {c.bike_model}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded">
                      {c.dealer_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {customers.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <IconMapPin size={20} />
                </div>
                <p className="font-medium text-gray-600 text-sm">No records found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
