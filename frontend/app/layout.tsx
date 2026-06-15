import type { Metadata } from 'next';
import './globals.css';

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
        {/* Navigation Bar matching CoinKaro */}
        <nav style={{ background: '#f5f5f5' }} className="h-[80px] px-5 md:px-[40px] lg:px-[80px] flex items-center justify-between">
          <div className="flex items-center justify-start">
            <img src="/veritasco.png" className="h-8 md:h-10 w-auto max-w-[150px] shrink-0 object-contain mix-blend-multiply" alt="VeritasCo Logo"/>
          </div>
          
          <div className="hidden md:flex items-center justify-center">
            <ul className="flex w-fit hover:text-neutral-400 bg-neutral-200 px-6 rounded-2xl mx-auto items-center justify-center space-x-6 h-12 text-[15px] text-neutral-700">
              <li className="flex items-center relative group h-12 cursor-pointer">
                <p className="h-full flex items-center group-hover:px-4 group-hover:text-black transition-all">Home</p>
              </li>
              <li className="flex items-center relative group h-12 cursor-pointer">
                <p className="h-full flex items-center group-hover:px-4 group-hover:text-black transition-all">Intelligence</p>
              </li>
              <li className="flex items-center relative group h-12 cursor-pointer">
                <p className="h-full flex items-center group-hover:px-4 group-hover:text-black transition-all">Settings</p>
              </li>
            </ul>
          </div>

          <div className="flex items-center">
            <button type="button" className="hidden md:flex bg-neutral-900 text-white text-[15px] rounded-full md:rounded-2xl h-11 w-fit pl-5 pr-4 items-center justify-center space-x-2">
              <span>Sign in</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </nav>
        
        <main className="flex-1 w-full bg-[#f5f5f5] p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
