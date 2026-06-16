'use client';

import { useState, useEffect } from 'react';
import UploadSection from '@/components/UploadSection';
import DashboardSection from '@/components/DashboardSection';
import MapSection from '@/components/MapSection';
import DatabaseSection from '@/components/DatabaseSection';
import VillageSearchSection from '@/components/VillageSearchSection';
import DataCleanseSection from '@/components/DataCleanseSection';
import ComingSoonSection from '@/components/ComingSoonSection';

type Tab = 'upload' | 'dashboard' | 'map' | 'database' | 'village' | 'cleanse';

// Clean Minimalist Icons
const IconSparkles = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.59 9.41L22 12L14.59 14.59L12 22L9.41 14.59L2 12L9.41 9.41L12 2Z" fill="#171717" />
  </svg>
);

const IconUpload = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#171717" : "#737373"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconDatabase = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#171717" : "#737373"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const IconAnalytics = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#171717" : "#737373"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconLocate = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#171717" : "#737373"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="10" r="3" />
    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
  </svg>
);

const IconUsers = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#171717" : "#737373"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconClean = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#171717" : "#737373"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path>
  </svg>
);

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('veritas_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'SHIVAM123@123') {
      setIsAuthenticated(true);
      localStorage.setItem('veritas_auth', 'true');
      window.dispatchEvent(new Event('auth_changed'));
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('database');
  };

  const tabs = [
    { id: 'upload', icon: (active: boolean) => <IconUpload active={active} />, label: 'Upload CSV' },
    { id: 'database', icon: (active: boolean) => <IconDatabase active={active} />, label: 'All Customers' },
    { id: 'dashboard', icon: (active: boolean) => <IconAnalytics active={active} />, label: 'Dashboard' },
    { id: 'map', icon: (active: boolean) => <IconLocate active={active} />, label: 'Map Search' },
    { id: 'village', icon: (active: boolean) => <IconUsers active={active} />, label: 'Find by Village' },
    { id: 'cleanse', icon: (active: boolean) => <IconClean active={active} />, label: 'Auto Correct Spelling' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fafafa] relative p-4">
        <div className="absolute inset-0 z-0 pointer-events-none" 
             style={{
               backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)`,
               backgroundSize: '40px 40px',
               maskImage: 'linear-gradient(to bottom, white, transparent)'
             }}>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 relative z-10 flex flex-col items-center">
          <div className="mb-6 flex flex-col items-center">
            <img src="/veritasco.png" alt="VeritasCo Logo" className="h-16 w-auto object-contain drop-shadow-sm" />
          </div>
          
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[13px] font-semibold text-gray-700 ml-1">Access Password</label>
              <input 
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setLoginError(false);
                }}
                placeholder="Enter password..."
                className={`w-full bg-gray-50 border ${loginError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-gray-900'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              />
              {loginError && <p className="text-xs text-red-500 font-medium ml-1 mt-1">Incorrect password. Access denied.</p>}
            </div>
            
            <button 
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl px-4 py-3 text-sm transition-all shadow-md shadow-gray-900/10 mt-2"
            >
              Secure Login
            </button>
          </form>

          <p className="text-[11px] text-gray-400 font-medium mt-8 text-center max-w-[250px]">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-[800px] min-h-[600px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="absolute inset-0 z-0 pointer-events-none" 
           style={{
             backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)`,
             backgroundSize: '40px 40px',
             maskImage: 'linear-gradient(to bottom, white, transparent)'
           }}>
      </div>
      
      <div className="w-full lg:w-[280px] bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col shrink-0 z-20 h-auto lg:h-full shadow-sm lg:shadow-none">
        <div className="p-4 lg:p-6 flex flex-col items-start h-full w-full">
           
           {/* Top padding for sidebar tabs */}
           <div className="h-2 w-full hidden lg:block"></div>

          <div className="flex flex-row lg:flex-col gap-2 w-full overflow-x-auto hide-scroll pb-1 lg:pb-0">
             {tabs.map(tab => {
               const active = activeTab === tab.id;
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as Tab)}
                   className={`
                     shrink-0 flex items-center gap-2 lg:gap-3 px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-lg text-[13px] lg:text-sm font-medium transition-all duration-200
                     ${active 
                       ? 'bg-gray-900 text-white shadow-md' 
                       : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                   `}
                 >
                   {tab.icon(active)}
                   <span className="whitespace-nowrap">{tab.label}</span>
                 </button>
               )
             })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">

        <div className="h-auto lg:h-[72px] px-4 py-4 lg:py-0 lg:px-8 border-b border-gray-200 flex flex-col lg:flex-row items-start lg:items-center justify-between shrink-0 gap-3 bg-white/60 backdrop-blur-md">
          <h2 className="hidden lg:block text-base lg:text-lg font-semibold text-gray-900 capitalize min-w-[200px]">
            {activeTab === 'upload' ? 'Upload CSV' : activeTab === 'database' ? 'All Customers' : activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'map' ? 'Map Search' : activeTab === 'cleanse' ? 'Auto Correct Spelling' : activeTab === 'village' ? 'Find by Village' : activeTab}
          </h2>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex items-center w-full lg:w-[320px] bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent transition-all shadow-sm">
              <IconSearch />
              <input
                type="text"
                placeholder="Search database..."
                className="bg-transparent border-none outline-none w-full ml-2 text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 relative">
          <div className="h-full">
            {activeTab === 'upload' && <UploadSection onSuccess={handleUploadSuccess} />}
            {activeTab === 'database' && <DatabaseSection key={`db-${refreshKey}`} />}
            {activeTab === 'dashboard' && <DashboardSection key={`dash-${refreshKey}`} />}
            {activeTab === 'map' && <MapSection key={`map-${refreshKey}`} />}
            {activeTab === 'village' && <VillageSearchSection key={`vil-${refreshKey}`} />}
            {activeTab === 'cleanse' && <DataCleanseSection key={`cln-${refreshKey}`} />}
          </div>
        </div>

      </div>
    </div>
  );
}
