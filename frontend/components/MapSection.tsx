'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { Search, Download, FileSpreadsheet, MapPin, FileText, Map as MapIcon, Navigation } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Dynamically import Leaflet Map to avoid SSR 'window is not defined' error
const LeafletMap = dynamic(() => import('./LeafletMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-neutral-50 rounded-[24px] flex items-center justify-center text-neutral-400 font-medium">Initializing Map Engine...</div>
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
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { q: searchQuery, format: 'json', limit: 1, countrycodes: 'in' }
      });

      if (geoRes.data && geoRes.data.length > 0) {
        const loc = { lat: parseFloat(geoRes.data[0].lat), lng: parseFloat(geoRes.data[0].lon) };
        setCenter(loc);

        const custRes = await axios.get('/api/search', {
          params: { lat: loc.lat, lng: loc.lng, radius: radius }
        });
        
        setCustomers(custRes.data);
      } else {
        alert("Location not found. Please try adding more details (e.g. Village, District).");
      }
    } catch (err) {
      console.error(err);
      alert("Search failed. Please try again.");
    }
    setLoading(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(customers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "Radius_Search_Results.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(23, 23, 23);
    doc.text(`VeritasCo Radius Intelligence Report`, 14, 22);
    
    // Add Subtitle
    doc.setFontSize(10);
    doc.setTextColor(115, 115, 115);
    doc.text(`Search Location: ${searchQuery || 'Custom Coordinates'} | Radius: ${radius}KM | Results: ${customers.length}`, 14, 30);

    const tableData = customers.map(c => [
      c.customer_name || 'N/A',
      c.mobile_number || 'N/A',
      `${c.village || ''}, ${c.district || ''}`.replace(/^,\s*/, ''),
      c.bike_model || 'N/A',
      c.dealer_name || 'N/A',
      c.distance ? `${c.distance.toFixed(2)} KM` : 'N/A'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Customer Name', 'Mobile', 'Location', 'Bike Model', 'Dealer', 'Distance']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`VeritasCo_Radius_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Controls */}
      <div className="bg-white border border-neutral-100 rounded-[24px] p-6 shadow-sm flex flex-col xl:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 ml-1">Search Origin</label>
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Hayaghat, Darbhanga"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-[16px] px-5 py-4 pl-12 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all font-medium placeholder:font-normal"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <MapPin className="absolute left-4 top-[18px] text-neutral-400" size={20} />
          </div>
        </div>
        
        <div className="w-full xl:w-48 relative">
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 ml-1">Radius Coverage</label>
          <select 
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-[16px] px-5 py-4 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all font-medium appearance-none cursor-pointer"
          >
            {[1, 5, 10, 15, 20, 25, 50, 100].map(r => (
              <option key={r} value={r}>{r} Kilometers</option>
            ))}
          </select>
          <Navigation className="absolute right-4 top-[38px] text-neutral-400 pointer-events-none" size={16} />
        </div>

        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-neutral-900 text-white h-[56px] px-8 rounded-[16px] font-semibold shadow-md hover:shadow-xl hover:bg-neutral-800 transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={18} />}
          <span>Run Analysis</span>
        </button>

        {customers.length > 0 && (
          <div className="flex gap-2">
            <button onClick={exportExcel} className="bg-white text-neutral-700 border border-neutral-200 h-[56px] px-5 rounded-[16px] hover:bg-neutral-50 transition-colors flex items-center space-x-2 font-semibold shadow-sm group">
              <FileSpreadsheet size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={exportPDF} className="bg-white text-neutral-700 border border-neutral-200 h-[56px] px-5 rounded-[16px] hover:bg-neutral-50 transition-colors flex items-center space-x-2 font-semibold shadow-sm group">
              <FileText size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[700px]">
        {/* Map Area */}
        <div className="xl:col-span-2 bg-white rounded-[24px] p-2 border border-neutral-100 shadow-sm relative z-0">
          <LeafletMap 
            center={center} 
            radius={radius} 
            customers={customers} 
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
          />
        </div>

        {/* Results Sidebar */}
        <div className="bg-white rounded-[24px] border border-neutral-100 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-6 pb-5 border-b border-neutral-100 bg-white z-10">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-neutral-900">Intelligence Results</h3>
              <div className="bg-neutral-100 text-neutral-600 text-xs font-bold px-3 py-1 rounded-full">{customers.length} hits</div>
            </div>
            <p className="text-sm text-neutral-500 font-medium">Ordered by nearest proximity</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
            {customers.map((c, i) => (
              <div 
                key={i} 
                className={`bg-white p-5 rounded-[16px] border transition-all cursor-pointer group ${selectedCustomer?.id === c.id ? 'border-neutral-900 shadow-md ring-1 ring-neutral-900' : 'border-neutral-200 shadow-sm hover:border-neutral-300 hover:shadow-md'}`}
                onClick={() => {
                  setCenter({ lat: c.latitude, lng: c.longitude });
                  setSelectedCustomer(c);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-neutral-900 text-base">{c.customer_name}</h4>
                    <p className="text-xs font-semibold text-neutral-400 mt-0.5">{c.mobile_number}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold uppercase tracking-wide bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-md">{c.distance?.toFixed(1)} km</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-sm">
                    <MapIcon size={14} className="text-neutral-400 mt-0.5 shrink-0" />
                    <span className="text-neutral-600 font-medium leading-tight">{c.village}, {c.district}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      {c.bike_model}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 px-2 py-1 rounded">
                      {c.dealer_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {customers.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 pb-10">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin size={24} className="text-neutral-300" />
                </div>
                <p className="font-semibold text-neutral-600 text-lg">No intelligence found</p>
                <p className="text-sm mt-1 max-w-[200px] text-center">Run an analysis above to populate this list.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
