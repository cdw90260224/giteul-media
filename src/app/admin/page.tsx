'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [todayCount, setTodayCount] = useState(0);
  const [nextSchedule, setNextSchedule] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPosts(data);
        
        // Calculate Today's Generated Count
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        const count = data.filter(p => new Date(p.created_at) >= startOfToday).length;
        setTodayCount(count);

        // Calculate Next Schedule (Static mock based on user request: 7, 1, 6)
        const hour = new Date().getHours();
        if (hour < 7) setNextSchedule('07:00 AM');
        else if (hour < 13) setNextSchedule('01:00 PM');
        else if (hour < 18) setNextSchedule('06:00 PM');
        else setNextSchedule('07:00 AM (Tomorrow)');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/auto-post', { method: 'POST' });
      const result = await res.json();
      
      if (res.ok) {
        alert('✨ [Batch Success] ' + (result.generated ? result.generated.length : '0') + '개의 신규 리포트가 발행되었습니다!');
        fetchPosts();
      } else {
        alert('⚠️ [발행 오류] ' + (result.error || '알 수 없는 오류'));
      }
    } catch (e) {
      alert('🚫 [연결 오류] 서버와 통신 불가');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/delete-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
        alert('🗑️ [삭제 완료] 정보 폐기 성공');
        fetchPosts();
      }
    } catch (e: any) {
      alert('🚫 [시스템 오류] 삭제 실패');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-40 w-full overflow-x-hidden">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 py-3 md:py-6 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm w-full">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="text-lg md:text-2xl font-black text-deep-navy italic tracking-tighter shrink-0">기틀.</Link>
            <div className="h-4 w-[1px] bg-gray-200 shrink-0"></div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 truncate">Control Hub</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button 
                onClick={handleGenerate}
                disabled={generating}
                className={`bg-deep-navy text-white px-3 md:px-8 py-1.5 md:py-3 rounded-full text-[9px] md:text-[12px] font-black shadow-xl tracking-widest transition-all ${
                    generating ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'
                }`}
            >
                {generating ? '집필 중' : '즉시 수동 집필'}
            </button>
            <Link href="/" className="text-[9px] md:text-[12px] font-black text-slate-300 hover:text-deep-navy tracking-widest uppercase shrink-0">Exit</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-20 w-full overflow-x-hidden">
        {/* Automation Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-20">
            <div className="bg-white p-6 md:p-8 rounded-[25px] md:rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-2 md:space-y-4">
                <span className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Today's Generation</span>
                <span className="text-4xl md:text-6xl font-black text-deep-navy">{todayCount}</span>
                <span className="text-[9px] md:text-[11px] font-bold text-green-500 uppercase tracking-tighter">10~15 Target Active</span>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[25px] md:rounded-[40px] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center space-y-2 md:space-y-4 border-t-4 border-t-blue-500">
                <span className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Next Auto Schedule</span>
                <span className="text-2xl md:text-4xl font-black text-slate-800">{nextSchedule}</span>
                <span className="text-[8px] md:text-[10px] font-bold text-slate-300 uppercase tracking-widest">Cron: 07, 13, 18</span>
            </div>
            <div className="bg-deep-navy p-6 md:p-8 rounded-[25px] md:rounded-[40px] shadow-2xl flex flex-col items-center justify-center space-y-2 md:space-y-4 text-white">
                <span className="text-[9px] md:text-[11px] font-black text-white/40 uppercase tracking-widest">Total Intelligence</span>
                <span className="text-4xl md:text-6xl font-black">{posts.length}</span>
                <div className="flex gap-2">
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full animate-ping"></span>
                    <span className="text-[8px] md:text-[10px] font-bold text-white/60 tracking-widest">ENGINE RUNNING</span>
                </div>
            </div>
        </section>

        <header className="mb-8 md:mb-16 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-6 md:pb-8 gap-3">
            <div className="space-y-1">
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter italic">Contents Repository.</h2>
                <p className="text-slate-400 font-bold text-[9px] md:text-sm uppercase tracking-widest">현재 발행된 모든 인텔리전스 배포 목록입니다.</p>
            </div>
        </header>

        {loading ? (
            <div className="space-y-4 md:space-y-6">
                {[1,2,3].map(i => (
                    <div key={i} className="h-20 md:h-24 bg-white border border-gray-100 rounded-[20px] md:rounded-[30px] animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col gap-4 md:gap-6 w-full max-w-full overflow-hidden">
                {posts.map((post) => (
                    <div key={post.id} className="bg-white border border-gray-100 rounded-[20px] md:rounded-[35px] p-3 md:p-6 flex items-center justify-between gap-2 md:gap-8 hover:shadow-2xl transition-all duration-500 group overflow-hidden w-full min-w-0">
                        <Link href={`/article/${post.id}`} className="flex items-center gap-3 md:gap-8 min-w-0 flex-1 overflow-hidden">
                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-2xl overflow-hidden bg-slate-50 shrink-0 border-2 border-white shadow-md md:shadow-lg">
                                <img 
                                    src={post.image_url} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt="thumb"
                                    onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}
                                />
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                                <div className="flex items-center gap-1.5 mb-0.5 md:mb-1">
                                    <span className="text-[7px] md:text-[9px] font-black text-deep-navy bg-blue-50 px-1.5 md:px-2 py-0.5 rounded uppercase tracking-widest shrink-0">{post.category}</span>
                                    <span className="text-[7px] md:text-[9px] font-bold text-slate-300 truncate">Ref. {post.id}</span>
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-[13px] md:text-lg whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-deep-navy group-hover:underline underline-offset-4 transition-all tracking-tight w-full">
                                    {post.title}
                                </h3>
                                <p className="text-[10px] md:text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis font-medium italic opacity-70 w-full">
                                    {post.summary}
                                </p>
                            </div>
                        </Link>
                        
                        <div className="flex items-center gap-1 md:gap-3 shrink-0 ml-1">
                            <Link 
                                href={`/article/${post.id}`}
                                className="text-[8px] md:text-[10px] font-black text-slate-400 hover:text-deep-navy bg-slate-50 hover:bg-white px-2 md:px-5 py-2 md:py-2.5 rounded-md md:rounded-xl transition-all border border-transparent hover:border-slate-100 shrink-0"
                            >
                                VIEW
                            </Link>
                            <button 
                                onClick={(e) => { e.preventDefault(); handleDelete(post.id); }}
                                className="text-[8px] md:text-[10px] font-black text-red-300 hover:text-white hover:bg-red-500 bg-red-50/50 px-2 md:px-5 py-2 md:py-2.5 rounded-md md:rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
