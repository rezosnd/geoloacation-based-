'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

// Clean Professional Icons
const IconUpload = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconFile = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function UploadSection({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: async (results) => {
        try {
          if (results.meta.fields && results.meta.fields.length < 3) {
            throw new Error("Could not detect columns. Ensure valid CSV format.");
          }
          const rows = results.data as any[];
          
          const findVal = (row: any, keys: string[]) => {
            const normalizedRow: Record<string, any> = {};
            for (const k in row) {
              normalizedRow[k.trim().toLowerCase()] = row[k];
            }
            for (const k of keys) {
              const val = normalizedRow[k.trim().toLowerCase()];
              if (val !== undefined && val !== null && val !== '') return String(val).trim();
            }
            return null;
          };

          const mappedRows = rows.map(r => ({
            customer_name: findVal(r, ['Contact Name', 'customer_name', 'CustomerName', 'Name']),
            mobile_number: findVal(r, ['Contact Mobile Number', 'mobile_number', 'Mobile', 'Mobile Number']),
            dealer_name: findVal(r, ['Dealer Name', 'dealer_name', 'DealerName']),
            dealer_code: findVal(r, ['Dealer Code', 'dealer_code', 'DealerCode']),
            address: findVal(r, ['Contact Address', 'address', 'Address']),
            village: findVal(r, ['Contact Tehsil', 'Contact City', 'village', 'Village', 'City', 'Tehsil']),
            district: findVal(r, ['Contact District', 'district', 'District']),
            state: findVal(r, ['Contact State', 'state', 'State']),
            pincode: findVal(r, ['Contact Pincode', 'pincode', 'Pincode']),
            bike_model: findVal(r, ['Model Name', 'bike_model', 'BikeModel', 'Model']),
            invoice_amount: findVal(r, ['Total Invoice Amount', 'invoice_amount', 'InvoiceAmount', 'Basic Price', 'Amount']),
            purchase_date: findVal(r, ['Invoice Date', 'purchase_date', 'PurchaseDate', 'Date'])
          })).filter(r => r.customer_name || r.mobile_number || r.village || r.dealer_code);

          if (mappedRows.length === 0) {
            throw new Error("No valid data found. Check headers.");
          }

          const BATCH_SIZE = 100; 
          const totalBatches = Math.ceil(mappedRows.length / BATCH_SIZE);
          
          for (let i = 0; i < totalBatches; i++) {
            const batch = mappedRows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            await axios.post('/api/upload', { records: batch });
            setProgress(Math.round(((i + 1) / totalBatches) * 100));
          }
          
          setUploading(false);
          onSuccess();
        } catch (err: any) {
          setError(err.response?.data?.error || err.message);
          setUploading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setUploading(false);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-3xl mx-auto">
      <div 
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full p-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-200">
          <IconUpload />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Upload Data</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
          Drag and drop your CSV file here, or click to browse your files.
        </p>

        {!file ? (
          <label className="glass-button px-6 py-2.5 cursor-pointer inline-block text-sm">
            Browse Files
            <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        ) : (
          <div className="border border-gray-200 bg-white p-5 rounded-xl text-left shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <IconFile />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)} 
                className="text-xs font-medium text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
            
            {uploading ? (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Processing data...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gray-900 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleUpload}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors mt-4"
              >
                Start Upload
              </button>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
                <div className="shrink-0 mt-0.5"><IconAlert /></div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
