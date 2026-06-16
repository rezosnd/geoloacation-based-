'use client';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from 'next/link';

export default function ComingSoonSection({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 min-h-[500px] relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium group">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 group-hover:-translate-x-1 transition-transform">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Dashboard
      </Link>

      <div className="w-64 h-64 mb-6 mt-4">
        <DotLottieReact
          src="/0945f68c-118c-11ee-a57d-7bf3c977581c.lottie"
          autoplay
          loop
        />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 text-center max-w-sm mb-8">
        We are actively developing the {title} module. It will be rolling out in an upcoming release!
      </p>
      
      <Link href="/">
        <button className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-xl transition-all shadow-md shadow-gray-900/10">
          Return to App
        </button>
      </Link>
    </div>
  );
}
