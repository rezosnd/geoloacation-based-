'use client';

import { useState } from 'react';
import { Upload, Map as MapIcon, BarChart3, Settings, Search, MapPin, Sparkles, Database } from 'lucide-react';
import UploadSection from '@/components/UploadSection';
import DashboardSection from '@/components/DashboardSection';
import MapSection from '@/components/MapSection';
import DatabaseSection from '@/components/DatabaseSection';

type Tab = 'upload' | 'dashboard' | 'map' | 'database';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('database');
  };

  const tabs = [
    { id: 'upload', icon: <Upload size={20} className="text-neutral-700" />, label: 'Upload' },
    { id: 'database', icon: <Database size={20} className="text-neutral-700" />, label: 'Database' },
    { id: 'dashboard', icon: <BarChart3 size={20} className="text-neutral-700" />, label: 'Analytics' },
    { id: 'map', icon: <MapPin size={20} className="text-neutral-700" />, label: 'Locate' },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 animate-fade-in w-full min-h-[calc(100vh-120px)] xl:h-[calc(100vh-120px)]">
      
      {/* LEFT SIDEBAR matching CoinKaro style */}
      <div className="w-full xl:w-[320px] flex flex-col gap-6 shrink-0">
        
        {/* Main Card container */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-neutral-100 flex flex-col items-center">
          
          {/* Logo Header inside sidebar */}
          <div className="flex items-center space-x-2 mb-8 w-full px-2">
            <Sparkles size={20} className="text-neutral-900" />
            <span className="font-bold text-neutral-900 text-xl tracking-tight">VeritasCo<span className="text-neutral-400 font-medium text-sm ml-1.5">Radius</span></span>
          </div>

          {/* Vertical Navigation List */}
          <div className="flex flex-col gap-2 w-full">
             {tabs.map((tab) => (
               <button 
                 key={tab.id} 
                 onClick={() => setActiveTab(tab.id as Tab)}
                 className={`flex items-center space-x-3 w-full px-4 py-3.5 rounded-[16px] transition-all font-medium text-sm ${
                   activeTab === tab.id 
                     ? 'bg-neutral-900 text-white shadow-md' 
                     : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                 }`}
               >
                 <div className={`${activeTab === tab.id ? 'text-white' : 'text-neutral-400'}`}>
                   {tab.icon}
                 </div>
                 <span>{tab.label}</span>
               </button>
             ))}
          </div>

        </div>

        {/* Refer and earn equivalent */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-neutral-100">
           <h3 className="font-semibold text-neutral-900 mb-2">Help & Documentation</h3>
           <p className="text-sm text-neutral-500 leading-relaxed mb-4">Learn how to format your CSVs correctly or how to leverage radius intelligence for sales growth.</p>
           <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Read the guide &rarr;</button>
        </div>

      </div>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 bg-white rounded-[32px] shadow-sm border border-neutral-100 flex flex-col overflow-hidden">
        
        {/* Header inside right panel */}
        <div className="h-[80px] px-8 border-b border-neutral-100 flex items-center justify-between shrink-0">
           <h2 className="text-lg font-semibold text-neutral-900">
             {activeTab === 'upload' ? 'Upload Data' : activeTab === 'database' ? 'Customer Database' : activeTab === 'dashboard' ? 'Analytics' : 'Radius Intelligence'}
           </h2>
           
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-neutral-500">
               <span>Select</span>
               <span className="flex flex-col leading-none -space-y-1">
                 <span className="text-[10px]">▲</span><span className="text-[10px]">▼</span>
               </span>
               <span className="font-medium text-neutral-900">All</span>
             </div>
             
             <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2.5 flex items-center w-[250px] md:w-[300px]">
               <Search size={16} className="text-neutral-400 mr-2" />
               <input 
                 type="text" 
                 placeholder="Search for locations, settings..." 
                 className="bg-transparent text-sm w-full focus:outline-none text-neutral-800 placeholder:text-neutral-400"
               />
             </div>
           </div>
        </div>

        {/* Body content (scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {activeTab === 'upload' && <UploadSection onSuccess={handleUploadSuccess} />}
          {activeTab === 'database' && <DatabaseSection key={`db-${refreshKey}`} />}
          {activeTab === 'dashboard' && <DashboardSection key={`dash-${refreshKey}`} />}
          {activeTab === 'map' && <MapSection key={`map-${refreshKey}`} />}
        </div>

      </div>
    </div>
  );
}
