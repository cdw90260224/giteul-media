import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Revalidate every 60 seconds (or 0 for real-time)
export const revalidate = 60;

export default async function Home() {
  // Fetch data from Supabase
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
  }

  // Use fetched posts OR empty array if fetch fails
  const newsItems = posts || [];

  return (
    <main className="flex-1 flex flex-col items-center min-h-screen pb-20 font-sans">
      
      {/* Portal Top Navigation Bar */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/">
              <h1 className="text-3xl font-black text-deep-navy tracking-tight shadow-none">기틀</h1>
            </Link>
            
            {/* Nav Menu */}
            <nav className="hidden md:flex items-center gap-6 mt-1">
              <span className="text-sm font-bold text-deep-navy border-b-2 border-deep-navy pb-1 cursor-pointer">홈 (오늘의 지표)</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">스타트업 M&A</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">리서치 랩</span>
              <span className="text-sm font-semibold text-gray-600 hover:text-deep-navy cursor-pointer transition-colors">기틀 오리지널</span>
            </nav>
          </div>
          
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder="기업명이나 데이터 검색..." 
                className="w-64 bg-portal-bg border border-gray-200 text-sm rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-deep-navy/30 transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
        
        {/* Top Featured Headline (Hero Banner style) - Using the first item as featured if exists */}
        {newsItems.length > 0 && (
          <section className="mb-10 w-full bg-deep-navy rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row items-center cursor-pointer group hover:shadow-xl transition-shadow duration-300">
             <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
               <span className="text-xs font-bold tracking-widest uppercase mb-3 text-white/70 bg-white/10 w-fit px-3 py-1 rounded-sm">
                 🌟 헤드라인 속보
               </span>
               <h2 className="text-3xl md:text-5xl font-black mb-5 leading-[1.15] text-white group-hover:text-blue-100 transition-colors">
                 {newsItems[0].title}
               </h2>
               <p className="text-base md:text-lg text-white/80 line-clamp-2 leading-relaxed">
                 {newsItems[0].summary}
               </p>
             </div>
             <div className="w-full md:w-1/2 md:h-full aspect-video md:aspect-auto bg-gray-800 relative overflow-hidden">
               <img 
                 src={newsItems[0].image || newsItems[0].image_url || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf"} 
                 alt="Top Headline Image" 
                 className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" 
               />
             </div>
          </section>
        )}

        {/* MSN Portal Style Masonry/Grid Layout */}
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">최신 업데이트</h2>
          <div className="flex-1 h-[1px] bg-gray-200 ml-4"></div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {newsItems.map((item) => (
            <Link href={`/article/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-deep-navy/30 transition-all duration-300 overflow-hidden">
              
              {/* Thumbnail Image */}
              <div className="w-full aspect-video bg-gray-100 overflow-hidden border-b border-gray-100 relative">
                <img 
                  src={item.image || item.image_url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71"} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 block" 
                />
              </div>
              
              {/* Card Content Box */}
              <div className="p-5 flex flex-col flex-1">
                
                {/* Taxonomy Label */}
                <div className="flex items-center mb-3">
                  <span className="text-[11px] font-black text-deep-navy bg-blue-50/80 border border-blue-100/50 px-2.5 py-1 rounded-[4px] tracking-wide">
                    {item.category || '뉴스'}
                  </span>
                </div>
                
                {/* Thick Bold Gothic Title */}
                <h3 className="text-xl md:text-[22px] font-black text-gray-900 mb-3 leading-snug group-hover:text-deep-navy transition-colors line-clamp-2">
                  {item.title}
                </h3>
                
                {/* Short 2-line Summary */}
                <p className="text-[15px] text-gray-600 line-clamp-2 mb-6 flex-1 leading-[1.6]">
                  {item.summary}
                </p>
                
                {/* Portal Footer (Logo & Date) */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    {/* Tiny Square Logo Accent */}
                    <span className="w-3.5 h-3.5 bg-deep-navy flex items-center justify-center rounded-sm">
                      <span className="text-[8px] font-black text-white shrink-0">G</span>
                    </span>
                    <span className="text-xs font-black text-deep-navy tracking-tight">기틀 미디어</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 font-sans tracking-wide">
                    {item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString() : '04.01.2026')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

      </div>
    </main>
  );
}
