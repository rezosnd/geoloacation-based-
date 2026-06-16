import type { Metadata } from 'next';
import './globals.css';
import ClientNav from '@/components/ClientNav';

export const metadata: Metadata = {
  title: 'VeritasCo Radius Intelligence',
  description: 'Smart customer geo-intelligence platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans min-h-screen flex flex-col bg-neutral-100 text-neutral-800`}>
        <ClientNav />
        
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 flex flex-col items-center">
          <div className="w-full max-w-[1400px]">
            {children}
          </div>
        </main>

        <footer className="w-full shrink-0 border-t border-gray-200 bg-[#f5f5f5] px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3 z-10 mt-auto">
          <div className="flex items-center gap-1.5 border-r border-gray-300 pr-3">
            <span className="text-[12px] text-gray-500 font-medium">Created by</span>
            <span className="text-[13px] font-bold text-gray-900 tracking-tight">rezosnd</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm ml-0.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <a href="https://instagram.com/r_e_z_o_s_nd" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 group cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-pink-500 transition-colors">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <span className="text-[12px] font-semibold text-gray-500 group-hover:text-pink-500 transition-colors">
              @r_e_z_o_s_nd
            </span>
          </a>
        </footer>
      </body>
    </html>
  );
}
