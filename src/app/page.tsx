'use client';

import React, { useState, useEffect, useMemo } from 'react';
import LinkNext from 'next/link';
import { supabase } from '@/lib/supabase';

// --- Components ---

function DDayBadge({ deadline, category, title, summary, className = "" }: { deadline?: string | null, category?: string, title?: string, summary?: string, className?: string }) {
  const isStrategy = title?.includes('[전략]') || category?.toLowerCase() === 'strategy';
  
  if (category && category !== '정부지원공고' && category !== 'strategy') {
    if (isStrategy) return <span className={`px-2 py-1 bg-slate-900 text-white text-[10px] font-black tracking-widest uppercase rounded-md ${className}`}>STRATEGY</span>;
    return <span className={`px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black tracking-widest uppercase rounded-md ${className}`}>NEWS</span>;
  }

  let finalDeadline = deadline;
  if (!finalDeadline || finalDeadline === '상시모집') {
    const datePattern = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})|(\d{1,2})[.\-/](\d{1,2})/;
    const match = (title + ' ' + (summary || '')).match(datePattern);
    if (match) {
      if (match[1]) finalDeadline = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      else finalDeadline = `2026-${match[4].padStart(2, '0')}-${match[5].padStart(2, '0')}`;
    }
  }

  const today = new Date('2026-05-06'); 
  today.setHours(0,0,0,0);

  if (!finalDeadline || finalDeadline === '상시모집') {
     return <span className={`px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black tracking-widest uppercase rounded-md ${className}`}>상시모집</span>;
  }
  
  const target = new Date(finalDeadline);
  target.setHours(0,0,0,0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return <span className={`px-2 py-1 bg-slate-200 text-slate-400 text-[10px] font-black uppercase rounded-md ${className}`}>마감</span>;
  if (diff === 0) return <span className={`px-2 py-1 bg-[#FF5C00] text-white text-[10px] font-black animate-pulse uppercase rounded-md shadow-lg shadow-orange-500/20 ${className}`}>D-DAY</span>;
  if (diff <= 3) return <span className={`px-2 py-1 bg-[#FF5C00] text-white text-[10px] font-black uppercase rounded-md shadow-lg shadow-orange-500/20 ${className}`}>D-{diff}</span>;
  return <span className={`px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-md ${className}`}>D-{diff}</span>;
}

export default function Home() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("데이터 인텔리전스 동기화 중...");
  
  const [activeTab, setActiveTab] = useState<'전체' | '지원 사업' | '뉴스·테크'>('전체');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [visibleItems, setVisibleItems] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEmailGateOpen, setIsEmailGateOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(['strategy', 'newsletter', 'bookmarks']);
  const [interestSectors, setInterestSectors] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    const msgs = ["포털 초기화 중...", "산업별 데이터 정리 중...", "최신 전략 리포트 동기화 중..."];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingMsg(msgs[i % msgs.length]);
      i++;
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setNewsItems(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const parseTitle = (fullTitle: string) => {
    const parts = fullTitle.split(']');
    if (parts.length > 1) return { institution: parts[0].replace('[', ''), title: parts.slice(1).join(']').trim() };
    return { institution: 'GITEUL', title: fullTitle };
  };

  const filteredItems = useMemo(() => {
    let list = [...newsItems];
    if (activeTab === '지원 사업') list = list.filter(i => i.category === '정부지원공고');
    if (activeTab === '뉴스·테크') list = list.filter(i => i.category !== '정부지원공고');
    if (selectedChips.length > 0) {
      list = list.filter(i => selectedChips.some(chip => (i.title + (i.summary || '')).includes(chip)));
    }
    if (searchQuery.trim()) {
      list = list.filter(i => i.title.includes(searchQuery));
    }
    return list;
  }, [newsItems, activeTab, selectedChips, searchQuery]);

  const trendingList = useMemo(() => [...newsItems].slice(0, 5), [newsItems]);
  const heroItem = newsItems[0];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase italic animate-pulse">{loadingMsg}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#FF5C00] selection:text-white">
      {/* HEADER: Zero-Blue & Minimal */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 px-8 py-5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <LinkNext href="/" className="text-3xl font-black tracking-tighter italic">GITEUL<span className="text-[#FF5C00]">.</span></LinkNext>
            <nav className="flex items-center gap-8">
              {['전체', '지원 사업', '뉴스·테크'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => { setActiveTab(tab as any); setVisibleItems(15); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`text-[14px] font-black tracking-widest transition-all relative ${activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute -bottom-6 left-0 w-full h-0.5 bg-slate-900" />}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
             <div className="relative w-72 hidden md:block">
                <input type="text" placeholder="검색어 입력..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5 text-[12px] font-bold outline-none focus:bg-white focus:border-slate-300 transition-all shadow-sm" />
             </div>
             <button onClick={() => setShowFilter(!showFilter)} className={`px-5 py-2.5 rounded-2xl font-black text-[12px] tracking-widest transition-all ${showFilter ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                필터 옵션
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-16">
        
        {/* HERO BENTO (Dynamic Collapse/Expand) */}
        <section className={`grid gap-8 transition-[height,opacity] duration-700 ease-in-out overflow-hidden ${activeTab === '전체' ? 'grid-cols-1 lg:grid-cols-10 h-[640px] mb-16 opacity-100' : 'grid-cols-1 h-[120px] mb-8 opacity-90 hover:opacity-100'}`}>
            <div className={`bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40 border border-slate-100 group transition-all duration-700 ${activeTab === '전체' ? 'lg:col-span-7 h-[640px]' : 'h-[120px]'}`}>
               <LinkNext href={`/article/${heroItem?.id || '#'}`} className={`flex w-full h-full ${activeTab === '전체' ? 'flex-col' : 'flex-row'}`}>
                  <div className={`overflow-hidden bg-slate-100 shrink-0 relative transition-all duration-700 ${activeTab === '전체' ? 'h-[55%] w-full' : 'h-full w-48'}`}>
                    <img 
                      src={heroItem?.image_url || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" 
                      alt="Hero" 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={`flex-1 flex flex-col justify-center bg-white z-10 transition-all duration-700 ${activeTab === '전체' ? 'p-12' : 'px-10 py-0'}`}>
                    <div className={`flex items-center gap-3 ${activeTab === '전체' ? 'mb-6' : 'mb-2'}`}>
                       <DDayBadge deadline={heroItem?.deadline_date} category={heroItem?.category} title={heroItem?.title} />
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{heroItem?.category}</span>
                    </div>
                    <h2 className={`font-black text-slate-900 tracking-tighter line-clamp-2 transition-all duration-700 ${activeTab === '전체' ? 'text-4xl mb-4 leading-tight' : 'text-2xl leading-snug'}`}>{parseTitle(heroItem?.title || '').title}</h2>
                    {activeTab === '전체' && <p className="text-[15px] text-slate-500 font-medium leading-relaxed line-clamp-2">{heroItem?.summary?.replace(/<[^>]*>/g, '')}</p>}
                  </div>
               </LinkNext>
            </div>

            <div className={`bg-white text-slate-900 border border-slate-100 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-2xl shadow-slate-200/40 relative overflow-hidden transition-all duration-700 ${activeTab === '전체' ? 'lg:col-span-3 h-[640px] opacity-100' : 'hidden opacity-0 w-0'}`}>
               <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 pointer-events-none">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
               </div>
               <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 shrink-0 z-10">
                  <h3 className="font-black text-2xl tracking-tighter text-slate-900">지금 뜨는 소식</h3>
                  <span className="text-[10px] font-black bg-[#FF5C00] text-white px-2 py-0.5 rounded-full italic animate-pulse">LIVE</span>
               </div>
               <div className="flex-1 flex flex-col justify-between mt-6 z-10">
                  {trendingList.map((item, idx) => (
                    <LinkNext key={item.id} href={`/article/${item.id}`} className="group relative flex gap-5 items-start">
                      <div className="flex-shrink-0">
                         <span className="text-3xl font-black text-slate-300 group-hover:text-[#FF5C00] transition-colors leading-none tracking-tighter italic">
                            {(idx + 1).toString().padStart(2, '0')}
                         </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                         <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                         </div>
                         <h4 className="text-[16px] font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-[#FF5C00] transition-colors tracking-tight">
                            {parseTitle(item.title).title}
                         </h4>
                      </div>
                    </LinkNext>
                  ))}
               </div>
            </div>
          </section>

        {/* ACTIVE FILTERS CHIPS */}
        {selectedChips.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in mb-8">
             {selectedChips.map(chip => (
               <button key={chip} onClick={() => setSelectedChips(c => c.filter(x => x !== chip))} className="px-5 py-2 bg-slate-900 text-white text-[12px] font-bold rounded-2xl flex items-center gap-3 shadow-md hover:bg-slate-800 transition-colors">
                 # {chip} <span className="opacity-50 text-xs">×</span>
               </button>
             ))}
          </div>
        )}

        {/* 3-COLUMN GRID FEED */}
        <section className="space-y-8 pb-32">
           <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <h2 className="text-3xl font-black tracking-tighter">
                {activeTab === '지원 사업' ? '맞춤 지원 공고' : activeTab === '뉴스·테크' ? '산업 동향 뉴스' : '인텔리전스 피드'}
              </h2>
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Total {filteredItems.length} Data</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.slice(0, visibleItems).map((item) => {
                const { title, institution } = parseTitle(item.title);
                return (
                  <LinkNext key={item.id} href={`/article/${item.id}`} className="group flex flex-col bg-white rounded-3xl border border-slate-100 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 transition-all overflow-hidden h-full">
                     <div className="h-48 overflow-hidden bg-slate-100 relative">
                        <img 
                          src={item.image_url} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop'; }}
                        />
                        <div className="absolute top-4 left-4">
                           <DDayBadge deadline={item.deadline_date} category={item.category} title={item.title} summary={item.summary} className="shadow-lg" />
                        </div>
                     </div>

                     <div className="p-8 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-200" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{institution}</span>
                        </div>
                        <h4 className="text-[18px] font-black text-slate-900 group-hover:text-[#FF5C00] leading-snug transition-colors tracking-tight line-clamp-2 mb-4">{title}</h4>
                        <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-[12px] font-bold text-slate-300">
                           <span>자세히 보기</span>
                           <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </div>
                     </div>
                  </LinkNext>
                );
              })}
           </div>

           {filteredItems.length > visibleItems && (
             <div className="pt-12 flex justify-center">
                <button onClick={() => setVisibleItems(v => v + 15)} className="px-12 py-5 bg-white border border-slate-200 rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-md">
                   더 많은 소식 불러오기
                </button>
             </div>
           )}
        </section>
      </main>

      {/* RIGHT SLIDING DRAWER: FILTER */}
      {showFilter && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFilter(false)} />
           <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-12 space-y-12 animate-drawer-in rounded-l-[2.5rem] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 shrink-0">
                 <h2 className="text-2xl font-black tracking-tighter">인텔리전스 필터</h2>
                 <button onClick={() => setShowFilter(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="space-y-10 flex-1 overflow-y-auto pr-2">
                 {['산업 분야', '지원 형태', '기업 규모'].map(category => (
                   <div key={category} className="space-y-4">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{category}</p>
                      <div className="flex flex-wrap gap-2">
                         {['기술/IT', '마케팅 바우처', '스타트업', 'R&D', '수출'].map(tag => (
                           <button 
                            key={tag} 
                            onClick={() => setSelectedChips(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag])}
                            className={`px-5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${selectedChips.includes(tag) ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900'}`}
                           >
                             {tag}
                           </button>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
              <div className="pt-6 border-t border-slate-100 space-y-3 shrink-0">
                 <button onClick={() => setShowFilter(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[14px] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors">필터 적용하기</button>
                 <button onClick={() => setSelectedChips([])} className="w-full py-4 text-slate-400 text-[12px] font-bold hover:text-slate-900 transition-colors">선택 초기화</button>
              </div>
           </div>
        </div>
      )}

      <footer className="bg-white py-32 text-center border-t border-slate-100">
         <div className="max-w-xl mx-auto px-10 space-y-8">
            <h2 className="text-4xl font-black tracking-tighter">Weekly Briefing<span className="text-[#FF5C00]">.</span></h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">2026년 비즈니스 의사결정을 위한 리포트를<br/>매일 아침 이메일로 전해드립니다.</p>
            <div className="flex flex-col gap-3 mt-8">
               <input type="email" placeholder="이메일 주소 입력" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold focus:border-slate-900 focus:bg-white outline-none transition-all shadow-sm" />
               <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[14px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">구독 시작하기</button>
            </div>
         </div>
      </footer>

      {/* Floating Subscription FAB */}
      {!isSubscribed && (
        <div className="fixed bottom-10 right-10 z-50">
          <button 
            onClick={() => setIsEmailGateOpen(true)}
            className="w-16 h-16 bg-slate-900 shadow-2xl rounded-2xl flex items-center justify-center text-white hover:bg-slate-800 hover:scale-110 transition-all group relative"
          >
            <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <div className="absolute right-full mr-4 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[12px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl border border-white/10">
              뉴스레터 구독하기 <span className="text-[#FF5C00] ml-1">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Subscription Modal (Zero-Blue) */}
      {isEmailGateOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsEmailGateOpen(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-[3.5rem] p-12 shadow-2xl animate-scale-in text-center space-y-8 max-h-[90vh] overflow-y-auto hide-scrollbar">
              <div className="flex justify-center">
                 <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black italic shadow-2xl shadow-slate-900/20">G</div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">기틀 지능형 뉴스레터</h3>
                <p className="text-[14px] text-slate-500 font-bold leading-relaxed">상위 1% 비즈니스 리더를 위한<br/>맞춤형 지원사업 및 전략 리포트</p>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 text-left space-y-4 border border-slate-100 shadow-inner">
                 {[
                   { id: 'strategy', label: '심층 전략 리포트 열람 권한' },
                   { id: 'newsletter', label: '매일 아침 맞춤형 뉴스레터 발송' },
                   { id: 'bookmarks', label: '관심 공고 북마크 및 데드라인 알림' }
                 ].map(benefit => {
                   const isSelected = selectedBenefits.includes(benefit.id);
                   return (
                     <button 
                       key={benefit.id} type="button"
                       onClick={() => setSelectedBenefits(prev => prev.includes(benefit.id) ? prev.filter(b => b !== benefit.id) : [...prev, benefit.id])}
                       className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${isSelected ? 'bg-white border-slate-900 shadow-md' : 'bg-transparent border-transparent opacity-60'}`}
                     >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                           {isSelected ? '✓' : ''}
                        </div>
                        <p className={`text-[13.5px] font-black tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{benefit.label}</p>
                     </button>
                   );
                 })}
              </div>

              <div className="text-left space-y-4">
                 <p className="text-[12px] font-black text-slate-900 ml-2">관심 산업 분야 (다중 선택)</p>
                 <div className="flex flex-wrap gap-2">
                    {['기술/IT', '농업/스마트팜', '소상공인', '제조업', '콘텐츠', '바이오/의료', '에너지/환경', '수출/무역', 'R&D'].map(sector => (
                      <button
                        key={sector} type="button"
                        onClick={() => setInterestSectors(prev => prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector])}
                        className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all border-2 ${interestSectors.includes(sector) ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {sector}
                      </button>
                    ))}
                 </div>
              </div>

              <form onSubmit={async (e) => { e.preventDefault(); if(userEmail) { setIsSubscribed(true); setIsEmailGateOpen(false); } }} className="space-y-4">
                <input 
                  type="email" 
                  required 
                  placeholder="뉴스레터를 받을 이메일 주소" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold focus:border-slate-900 outline-none transition-all shadow-sm text-slate-900" 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                />
                 <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">프리미엄 혜택 시작하기 →</button>
              </form>
              <div className="pt-2 border-t border-slate-50">
                <button onClick={() => setIsEmailGateOpen(false)} className="text-slate-400 text-sm font-bold hover:text-slate-900 transition-colors mt-4">다음에 할게요</button>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-drawer-in { animation: drawer-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes scale-in { from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
