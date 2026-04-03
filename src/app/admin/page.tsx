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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-40">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 py-6 px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-black text-deep-navy italic tracking-tighter">기틀.</Link>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unmanned Control Hub</span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={handleGenerate}
                disabled={generating}
                className={`bg-deep-navy text-white px-8 py-3 rounded-full text-[12px] font-black shadow-xl tracking-widest transition-all ${
                    generating ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'
                }`}
            >
                {generating ? '배치 집필 중...' : '🔥 즉시 수동 배치 집필'}
            </button>
            <Link href="/" className="text-[12px] font-black text-slate-300 hover:text-deep-navy tracking-widest uppercase ml-4">Portal Exit</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Automation Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Today's Generation</span>
                <span className="text-6xl font-black text-deep-navy">{todayCount}</span>
                <span className="text-[11px] font-bold text-green-500 uppercase tracking-tighter">10~15 Target Active</span>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center space-y-4 border-t-4 border-t-blue-500">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Next Auto Schedule</span>
                <span className="text-4xl font-black text-slate-800">{nextSchedule}</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Cron Job: Daily (07, 13, 18)</span>
            </div>
            <div className="bg-deep-navy p-8 rounded-[40px] shadow-2xl flex flex-col items-center justify-center space-y-4 text-white">
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Total Intelligence</span>
                <span className="text-6xl font-black">{posts.length}</span>
                <div className="flex gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-bold text-white/60 tracking-widest">ENGINE RUNNING</span>
                </div>
            </div>
        </section>

        <header className="mb-16 flex items-end justify-between border-b border-slate-100 pb-8">
            <div className="space-y-1">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Contents Repository.</h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">현재 발행된 모든 인텔리전스 배포 목록입니다.</p>
            </div>
        </header>

        {loading ? (
            <div className="space-y-6">
                {[1,2,3].map(i => (
                    <div key={i} className="h-24 bg-white border border-gray-100 rounded-[30px] animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="grid gap-6">
                {posts.map((post) => (
                    <div key={post.id} className="bg-white border border-gray-100 rounded-[35px] p-6 flex items-center justify-between hover:shadow-2xl transition-all duration-500 group">
                        <Link href={`/article/${post.id}`} className="flex items-center gap-8 flex-1 min-w-0">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border-2 border-white shadow-lg">
                                <img 
                                    src={post.image_url} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt="thumb"
                                    onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}
                                />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-deep-navy bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">{post.category}</span>
                                    <span className="text-[9px] font-bold text-slate-300">Ref. {post.id}</span>
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-lg truncate group-hover:text-deep-navy group-hover:underline underline-offset-4 transition-all tracking-tight">{post.title}</h3>
                                <p className="text-xs text-slate-400 line-clamp-1 font-medium italic opacity-70">{post.summary}</p>
                            </div>
                        </Link>
                        <div className="flex items-center gap-4 px-4">
                            <Link 
                                href={`/article/${post.id}`}
                                className="text-[10px] font-black text-slate-400 hover:text-deep-navy bg-slate-50 hover:bg-white px-5 py-2.5 rounded-xl transition-all border border-transparent hover:border-slate-100"
                            >
                                VIEW
                            </Link>
                            <button 
                                onClick={(e) => { e.preventDefault(); handleDelete(post.id); }}
                                className="text-[10px] font-black text-red-300 hover:text-white hover:bg-red-500 bg-red-50/50 px-5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
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
