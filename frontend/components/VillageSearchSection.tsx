'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const IconSpreadsheet = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></svg>;
const IconFileText = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
const IconMapPin = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;

export default function VillageSearchSection() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [availablePincodes, setAvailablePincodes] = useState<any[]>([]);
  const [officialVillages, setOfficialVillages] = useState<string[]>([]);
  const [allPincodeCustomers, setAllPincodeCustomers] = useState<any[]>([]);
  
  // Selection states
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  
  // Loading states
  const [loadingPincodes, setLoadingPincodes] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    fetchPincodes();
  }, []);

  const fetchPincodes = async () => {
    setLoadingPincodes(true);
    try {
      const res = await axios.get('/api/pincodes');
      setAvailablePincodes(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingPincodes(false);
  };

  const handleSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      handleBack();
      return;
    }

    setSearchQuery(queryToSearch);
    setLoadingSearch(true);
    setOfficialVillages([]);
    setSelectedVillages([]);
    setAllPincodeCustomers([]);

    try {
      const isPincode = /^\d{6}$/.test(queryToSearch.trim());
      
      if (isPincode) {
        // 1. Fetch Official Villages from Indian Postal API
        try {
          const postalRes = await axios.get(`https://api.postalpincode.in/pincode/${queryToSearch.trim()}`);
          if (postalRes.data && postalRes.data[0] && postalRes.data[0].Status === 'Success') {
            const vils = postalRes.data[0].PostOffice.map((po: any) => po.Name);
            setOfficialVillages(vils);
          } else {
            setOfficialVillages([]);
          }
        } catch (e) {
          console.error('Postal API failed', e);
        }

        // 2. Fetch all customers for this pincode from our DB
        const custRes = await axios.get('/api/customers-by-pincode', { params: { pincode: queryToSearch.trim() }});
        setAllPincodeCustomers(custRes.data);
      } else {
        // Fallback if they search a village name instead of a pincode
        alert("Please enter a 6-digit Pincode to view its actual villages and members.");
      }
    } catch (err) {
      console.error(err);
      alert('Failed to search.');
    }
    setLoadingSearch(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleBack = () => {
    setSearchQuery('');
    setOfficialVillages([]);
    setSelectedVillages([]);
    setAllPincodeCustomers([]);
  };

  const toggleVillage = (villageName: string) => {
    setSelectedVillages(prev => 
      prev.includes(villageName) 
        ? prev.filter(v => v !== villageName)
        : [...prev, villageName]
    );
  };

  const selectAll = () => {
    if (selectedVillages.length === officialVillages.length) {
      setSelectedVillages([]);
    } else {
      setSelectedVillages([...officialVillages]);
    }
  };

  // Filter customers based on selected official villages
  // Because the DB 'village' column often wrongly contains the district (like "Darbhanga"),
  // we check if the selected village name appears in their 'address' string as a fallback.
  const displayedCustomers = useMemo(() => {
    if (selectedVillages.length === 0) return allPincodeCustomers; // If none selected, show ALL members of pincode
    
    return allPincodeCustomers.filter(c => {
      const addr = (c.address || '').toLowerCase();
      const vil = (c.village || '').toLowerCase();
      return selectedVillages.some(selectedVil => {
        const lowerSelected = selectedVil.toLowerCase();
        return vil.includes(lowerSelected) || addr.includes(lowerSelected);
      });
    });
  }, [allPincodeCustomers, selectedVillages]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(displayedCustomers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "Pincode_Results.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`VeritasCo Pincode Report`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Origin: ${searchQuery} | Results: ${displayedCustomers.length}`, 14, 30);

    const tableData = displayedCustomers.map(c => [
      c.customer_name || 'N/A',
      c.mobile_number || 'N/A',
      c.address || 'N/A',
      c.village || 'N/A',
      c.bike_model || 'N/A'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Name', 'Mobile', 'Address', 'Database Village', 'Model']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`Pincode_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Left Sidebar - Village Selection */}
      <div className="w-full lg:w-1/3 glass-panel flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-white shrink-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Target by Pincode</h3>
          <form onSubmit={handleFormSubmit} className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === '') handleBack();
              }}
              placeholder="Enter Pincode (e.g. 847104)"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
            <div className="absolute left-3.5 top-[11px] text-gray-400">
              <IconSearch />
            </div>
            <button type="submit" className="hidden">Search</button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-3">
          {loadingSearch ? (
            <div className="text-center p-6 text-sm text-gray-500">Extracting Official Records...</div>
          ) : officialVillages.length === 0 && allPincodeCustomers.length === 0 ? (
            <div className="space-y-2">
              <div className="px-2 py-1 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Active Pincodes</span>
              </div>
              {loadingPincodes ? (
                <div className="text-center p-6 text-sm text-gray-500">Loading database pincodes...</div>
              ) : (
                availablePincodes.map((pin, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSearch(pin.pincode)}
                    className="p-3 rounded-lg border bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{pin.pincode}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{pin.location}</p>
                    </div>
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{pin.count} records</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2 py-1 mb-2">
                <button 
                  onClick={handleBack} 
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <IconArrowLeft /> Back
                </button>
                <button onClick={selectAll} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  {selectedVillages.length === officialVillages.length ? 'Clear Filters' : 'Select All'}
                </button>
              </div>
              
              <div className="px-2 mb-2">
                <p className="text-xs text-gray-500">Official Postal Villages for <strong className="text-gray-900">{searchQuery}</strong>. Select to filter the database records.</p>
              </div>

              {officialVillages.map((v, i) => (
                <div 
                  key={i} 
                  onClick={() => toggleVillage(v)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                    selectedVillages.includes(v) 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <h4 className={`text-sm font-medium ${selectedVillages.includes(v) ? 'text-blue-900' : 'text-gray-900'}`}>
                      {v}
                    </h4>
                  </div>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedVillages.includes(v) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                    {selectedVillages.includes(v) && <IconCheck />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Content - Customer Data */}
      <div className="w-full lg:w-2/3 glass-panel flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-white shrink-0 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Extracted Database Members</h3>
            <p className="text-xs text-gray-500 mt-0.5">Showing {displayedCustomers.length} records</p>
          </div>
          {displayedCustomers.length > 0 && (
            <div className="flex gap-2">
              <button onClick={exportExcel} className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
                <IconSpreadsheet /> Excel
              </button>
              <button onClick={exportPDF} className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
                <IconFileText /> PDF
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-white p-0">
          {displayedCustomers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                <IconMapPin />
              </div>
              <p className="text-sm">Click a Pincode to view all members</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 sticky top-0 font-medium">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedCustomers.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.mobile_number}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={c.address}>{c.address || c.village}</td>
                    <td className="px-4 py-3 text-gray-600">{c.bike_model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
