'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import axios from 'axios';

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
            throw new Error("Could not detect columns. Please ensure your file is a valid comma or tab separated CSV/TSV.");
          }
          const rows = results.data as any[];
          
          // Helper to safely find a value by multiple possible case-insensitive keys
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
            console.error("Columns detected:", results.meta.fields);
            console.error("First row:", rows[0]);
            throw new Error("No valid data found. Check your column headers.");
          }

          const BATCH_SIZE = 100; // Smaller batches to avoid Vercel timeouts or payload too large
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
    <div className="bg-white rounded-[24px] border border-neutral-100 shadow-sm flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div 
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full max-w-2xl p-12 rounded-[24px] border-2 border-dashed border-neutral-200 transition-all cursor-pointer hover:bg-neutral-50/50 hover:border-neutral-300"
      >
        <div className="mx-auto w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <UploadCloud size={32} className="text-neutral-600" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-neutral-900">Upload Intelligence Data</h2>
        <p className="text-neutral-500 mb-8 max-w-md mx-auto text-sm leading-relaxed font-medium">
          Drag and drop your customer CSV file here. The system will automatically clean addresses, geocode locations, and build your radius database.
        </p>

        {!file ? (
          <label className="bg-neutral-900 text-white px-8 py-4 rounded-[16px] font-semibold cursor-pointer shadow-md hover:bg-neutral-800 hover:shadow-lg transition-all inline-block">
            Browse CSV Files
            <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        ) : (
          <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 text-left shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <FileText className="text-neutral-600" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{file.name}</p>
                  <p className="text-sm text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)} 
                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors bg-red-50 px-3 py-1.5 rounded-full"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
            
            {uploading ? (
              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-neutral-600">Processing & Geocoding...</span>
                  <span className="text-neutral-900">{progress}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-neutral-900 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleUpload}
                className="w-full bg-neutral-900 text-white py-3.5 rounded-full font-medium hover:bg-neutral-800 shadow-md hover:shadow-lg transition-all mt-6"
              >
                Start Processing
              </button>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
