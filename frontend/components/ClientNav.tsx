'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ClientNav() {
  const [isAuth, setIsAuth] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAuth(localStorage.getItem('veritas_auth') === 'true');

    const handleAuthChange = () => {
      setIsAuth(localStorage.getItem('veritas_auth') === 'true');
    };
    window.addEventListener('auth_changed', handleAuthChange);
    return () => window.removeEventListener('auth_changed', handleAuthChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('veritas_auth');
    window.dispatchEvent(new Event('auth_changed'));
    window.location.href = '/';
  };

  if (!mounted) return <nav style={{ background: '#f5f5f5' }} className="h-[80px] w-full shrink-0 border-b border-gray-200"></nav>;

  return (
    <nav style={{ background: '#f5f5f5' }} className="h-[80px] px-5 md:px-[40px] lg:px-[80px] flex items-center justify-between border-b border-gray-200 shrink-0">
      <div className="flex items-center justify-start w-1/3">
        <Link href="/">
          <img src="/veritasco.png" className="h-8 md:h-10 w-auto max-w-[150px] shrink-0 object-contain mix-blend-multiply cursor-pointer" alt="VeritasCo Logo"/>
        </Link>
      </div>
      
      {isAuth && (
        <>
          <div className="hidden md:flex items-center justify-center flex-1">
            <ul className="flex w-fit hover:text-neutral-400 bg-neutral-200 px-6 rounded-2xl mx-auto items-center justify-center space-x-6 h-12 text-[15px] text-neutral-700">
              <Link href="/home">
                <li className="flex items-center relative group h-12 cursor-pointer">
                  <p className="h-full flex items-center group-hover:px-4 group-hover:text-black transition-all">Home</p>
                </li>
              </Link>
              <Link href="/intelligence">
                <li className="flex items-center relative group h-12 cursor-pointer">
                  <p className="h-full flex items-center group-hover:px-4 group-hover:text-black transition-all">Intelligence</p>
                </li>
              </Link>
              <Link href="/settings">
                <li className="flex items-center relative group h-12 cursor-pointer">
                  <p className="h-full flex items-center group-hover:px-4 group-hover:text-black transition-all">Settings</p>
                </li>
              </Link>
            </ul>
          </div>

          <div className="flex items-center justify-end w-1/3">
            <button 
              onClick={handleLogout}
              type="button" 
              className="hidden md:flex bg-neutral-900 text-white text-[15px] rounded-full md:rounded-2xl h-11 w-fit pl-5 pr-4 items-center justify-center space-x-2 transition-all hover:bg-neutral-800 shadow-md shadow-gray-900/10"
            >
              <span>Log out</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                 <polyline points="16 17 21 12 16 7"></polyline>
                 <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
