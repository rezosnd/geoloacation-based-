'use client';

import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const IconSparkles = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path></svg>;
const IconCheckCircle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconSpreadsheet = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></svg>;
const IconSpinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function DataCleanseSection() {
  const [pincode, setPincode] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingFix, setLoadingFix] = useState(false);
  const [loadingGlobalFix, setLoadingGlobalFix] = useState(false);
  const [globalProgress, setGlobalProgress] = useState({ current: 0, total: 0, percent: 0, currentPin: '' });
  const [fixResult, setFixResult] = useState<any>(null);
  const [globalFixResult, setGlobalFixResult] = useState<any>(null);
  
  // Filtering
  const [filterVillage, setFilterVillage] = useState('');

  const handleGlobalCleanse = async () => {
    if (!window.confirm("Are you sure you want to run the global data cleanse? This will scan your entire database. It may take a minute.")) return;
    
    setLoadingGlobalFix(true);
    setGlobalFixResult(null);
    setFixResult(null);

    try {
      // 1. Fetch all unique pincodes
      const pinRes = await axios.get('/api/pincodes');
      const allPins = pinRes.data;
      
      if (!allPins || allPins.length === 0) {
        alert("No pincodes found in database.");
        setLoadingGlobalFix(false);
        return;
      }

      const total = allPins.length;
      let totalUpdated = 0;
      let failed = 0;

      // 2. Loop through each pincode in chunks of 5 for massive speed boost
      const CHUNK_SIZE = 5;
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = allPins.slice(i, i + CHUNK_SIZE);
        
        setGlobalProgress({
          current: Math.min(i + CHUNK_SIZE, total),
          total: total,
          percent: Math.round((Math.min(i + CHUNK_SIZE, total) / total) * 100),
          currentPin: chunk.map((p: any) => p.pincode).join(', ')
        });

        const chunkPromises = chunk.map(async (pinObj: any) => {
          try {
            const cleanRes = await axios.post('/api/cleanse', { pincode: pinObj.pincode });
            if (cleanRes.data && cleanRes.data.updatedCount) {
              return cleanRes.data.updatedCount;
            }
          } catch (e) {
            return -1; // -1 means failed
          }
          return 0;
        });

        const results = await Promise.all(chunkPromises);
        
        for (const res of results) {
          if (res === -1) failed++;
          else totalUpdated += res;
        }
      }

      setGlobalFixResult({
        totalUpdated,
        processedPincodes: total,
        failed
      });

      // Optional: Refresh current manual view if open
      if (customers.length > 0 && pincode) {
        const updatedRes = await axios.get('/api/customers-by-pincode', { params: { pincode: pincode.trim() } });
        setCustomers(updatedRes.data);
      }

    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to apply global auto-corrections.');
    }
    setLoadingGlobalFix(false);
  };

  const fetchCustomers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      alert("Please enter a valid 6-digit Pincode.");
      return;
    }

    setLoadingSearch(true);
    setFixResult(null);
    try {
      const res = await axios.get('/api/customers-by-pincode', { params: { pincode: pincode.trim() } });
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load records.');
    }
    setLoadingSearch(false);
  };

  const handleAutoFix = async () => {
    setLoadingFix(true);
    try {
      const res = await axios.post('/api/cleanse', { pincode: pincode.trim() });
      setFixResult(res.data);
      
      // Reload customers to show corrected data
      const updatedRes = await axios.get('/api/customers-by-pincode', { params: { pincode: pincode.trim() } });
      setCustomers(updatedRes.data);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to apply auto-corrections.');
    }
    setLoadingFix(false);
  };

  const exportExcel = () => {
    const dataToExport = displayedCustomers.map(c => ({
      Customer: c.customer_name,
      Mobile: c.mobile_number,
      PurchaseDate: c.purchase_date ? new Date(c.purchase_date).toLocaleDateString() : '',
      BikeModel: c.bike_model,
      RawAddress: c.address,
      Village: c.village,
      District: c.district,
      State: c.state
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cleaned_Data");
    XLSX.writeFile(wb, `Records_${pincode}.xlsx`);
  };

  // Village analytics
  const villageCounts = customers.reduce((acc: any, c: any) => {
    const v = c.village || 'Unknown';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
  
  const uniqueVillages = Object.keys(villageCounts).sort();

  const displayedCustomers = filterVillage 
    ? customers.filter(c => (c.village || 'Unknown') === filterVillage)
    : customers;

  return (
    <div className="flex flex-col gap-6 pb-8">
      
      <div className="glass-panel p-6 shrink-0 flex flex-col items-start gap-6">
        <div className="max-w-2xl w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Fix Entire Database</h3>
          <p className="text-sm text-gray-500 mb-4">
            Click this button to automatically scan your entire database. It will extract official village names from raw text and fix all incorrect district/village names using real Post Office data.
          </p>

          {!loadingGlobalFix && !globalFixResult && (
            <button 
              onClick={handleGlobalCleanse}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <IconSparkles />
              Fix All Records
            </button>
          )}

          {loadingGlobalFix && (
            <div className="w-full max-w-md space-y-2 mt-2">
              <div className="flex justify-between text-xs font-medium text-gray-600">
                <span>Processing Pincode: {globalProgress.currentPin} ({globalProgress.current}/{globalProgress.total})</span>
                <span>{globalProgress.percent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 ease-out" 
                  style={{ width: `${globalProgress.percent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {globalFixResult && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl max-w-md w-full flex items-start gap-3 shadow-sm">
            <div className="text-emerald-600 mt-0.5"><IconCheckCircle /></div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-900">Successfully Fixed!</h4>
              <p className="text-xs text-emerald-700 mt-1">
                Fixed and corrected <strong>{globalFixResult.totalUpdated} records</strong> across {globalFixResult.processedPincodes} different pincodes.
              </p>
              {globalFixResult.failed > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  Note: {globalFixResult.failed} pincodes were skipped (invalid or no real postal data).
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel p-6 shrink-0 border-t border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Manual Review (Optional)</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-3xl">
          Enter a Pincode to manually see and fix its records using the Official Indian Postal API.
        </p>

        <form onSubmit={fetchCustomers} className="flex gap-3 max-w-md">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter Pincode (e.g. 847104)"
              className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm"
            />
            <div className="absolute left-3.5 top-[11px] text-gray-400">
              <IconSearch />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loadingSearch}
            className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
          >
            {loadingSearch ? 'Loading...' : 'Review'}
          </button>
        </form>
      </div>

      {customers.length > 0 && (
        <div className="glass-panel flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Database Records for {pincode}</h3>
              <p className="text-xs text-gray-500 mt-1">{displayedCustomers.length} records found.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select 
                value={filterVillage}
                onChange={(e) => setFilterVillage(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2"
              >
                <option value="">All Villages ({customers.length} buyers)</option>
                {uniqueVillages.map((v, i) => (
                  <option key={i} value={v}>{v} ({villageCounts[v]} buyers)</option>
                ))}
              </select>

              <button 
                onClick={exportExcel}
                className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors justify-center"
              >
                <IconSpreadsheet /> Export
              </button>

              <button 
                onClick={handleAutoFix}
                disabled={loadingFix}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-w-[190px] justify-center"
              >
                {loadingFix ? (
                  <>
                    <IconSpinner />
                    Applying Fixes...
                  </>
                ) : (
                  <>
                    <IconSparkles />
                    1-Click Auto Fix Spelling
                  </>
                )}
              </button>
            </div>
          </div>

          {fixResult && (
            <div className="bg-emerald-50 border-b border-emerald-100 p-4 shrink-0 flex items-start gap-3">
              <div className="text-emerald-600 mt-0.5"><IconCheckCircle /></div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-900">Fixed {fixResult.updatedCount} Records!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  <strong>Official District:</strong> {fixResult.officialDistrict} | <strong>Official State:</strong> {fixResult.officialState}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Matched messy raw addresses with these real villages: {fixResult.villagesDetected.join(', ')}.
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto bg-gray-50 rounded-b-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b border-gray-200 text-gray-500 sticky top-0 font-medium whitespace-nowrap">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Mobile No.</th>
                  <th className="px-6 py-3">Purchase Date</th>
                  <th className="px-6 py-3">Bike Model</th>
                  <th className="px-6 py-3">Raw Address</th>
                  <th className="px-6 py-3 bg-blue-50/50">Village (DB)</th>
                  <th className="px-6 py-3 bg-blue-50/50">District (DB)</th>
                  <th className="px-6 py-3 bg-blue-50/50">State (DB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {displayedCustomers.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 whitespace-nowrap">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.customer_name}</td>
                    <td className="px-6 py-3 text-gray-700">{c.mobile_number || '-'}</td>
                    <td className="px-6 py-3 text-gray-700">{c.purchase_date ? new Date(c.purchase_date).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-3 text-gray-700">{c.bike_model || '-'}</td>
                    <td className="px-6 py-3 text-gray-500 max-w-xs truncate" title={c.address}>{c.address || '-'}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">{c.village || '-'}</td>
                    <td className="px-6 py-3 text-gray-700">{c.district || '-'}</td>
                    <td className="px-6 py-3 text-gray-700">{c.state || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
