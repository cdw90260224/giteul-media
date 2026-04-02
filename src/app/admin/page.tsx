'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPosts(data);
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
        alert('성공: 기사가 발행되었습니다!');
        fetchPosts();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (e) {
      alert('발행 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  // Improved Delete Logic with Error Handling
  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 기사를 DB에서 영구 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) {
        alert('삭제 실패: ' + error.message + '\n\n(Supabase SQL Editor에서 ALTER TABLE posts DISABLE ROW LEVEL SECURITY; 명령어를 실행했는지 확인해 주세요!)');
      } else {
        alert('성공적으로 삭제되었습니다.');
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (e: any) {
      alert('삭제 중 예기치 못한 오류: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20 selection:bg-slate-900 selection:text-white">
      <nav className="border-b border-gray-100 py-6 px-10 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-black text-deep-navy tracking-tight italic">기틀</Link>
            <span className="text-slate-100 font-thin text-3xl">/</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Admin Control Center</span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={handleGenerate}
                disabled={generating}
                className={`bg-deep-navy text-white px-8 py-3 rounded-full text-[10px] font-black shadow-xl tracking-widest transition-all ${
                    generating ? 'opacity-50' : 'hover:scale-105 active:scale-95'
                }`}
            >
                {generating ? 'GENERATING...' : '🔥 INSTANT NEW REPORT'}
            </button>
            <Link href="/" className="text-[10px] font-black text-slate-300 hover:text-deep-navy transition-colors tracking-widest">EXIT</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-10 py-20">
        <header className="mb-16 space-y-4">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Content Hub.</h2>
            <p className="text-slate-400 font-bold text-sm tracking-tight border-l-4 border-slate-100 pl-6">기틀 미디어의 모든 리치 리포트를 실시간으로 제어하고 삭제합니다.</p>
        </header>

        {loading ? (
            <div className="flex items-center justify-center p-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-navy"></div>
            </div>
        ) : (
            <div className="space-y-6">
                {posts.length === 0 && (
                    <div className="text-center py-32 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                        <p className="text-slate-300 font-black text-xs uppercase tracking-widest">No reports found.</p>
                    </div>
                )}
                {posts.map((post) => (
                    <div key={post.id} className="bg-white border border-slate-50 rounded-[30px] p-6 flex items-center justify-between hover:shadow-2xl hover:border-white transition-all group overflow-hidden relative">
                        <div className="flex items-center gap-8 flex-1 min-w-0">
                            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-50 shrink-0 border-4 border-white shadow-xl">
                                <img 
                                    src={post.image_url} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt="thumb"
                                    onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}
                                />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-deep-navy bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{post.category}</span>
                                    <span className="text-[9px] font-bold text-slate-300">{new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                                </div>
                                <h3 className="font-black text-slate-800 text-xl truncate tracking-tight">{post.title}</h3>
                                <p className="text-xs text-slate-400 line-clamp-1 max-w-3xl font-medium">{post.summary}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 px-6">
                            <Link 
                                href={`/article/${post.id}`}
                                className="text-[10px] font-black text-slate-400 hover:text-deep-navy bg-slate-50 hover:bg-white px-5 py-2.5 rounded-xl transition-all border border-transparent hover:border-slate-100"
                            >
                                VIEW
                            </Link>
                            <button 
                                onClick={() => handleDelete(post.id)}
                                className="text-[10px] font-black text-red-400 hover:text-white hover:bg-red-500 bg-red-50 px-5 py-2.5 rounded-xl transition-all border border-transparent hover:border-red-500"
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-10 pt-32 pb-16 flex items-center justify-between border-t border-slate-50">
         <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-900 italic tracking-tighter">Giteul Intelligence. Admin Panel</p>
            <p className="text-[10px] text-slate-300">Authorization Required • Secure Access Only</p>
         </div>
         <p className="text-[10px] text-slate-200 uppercase tracking-widest font-black">Powered by Gemini 2.5</p>
      </footer>
    </div>
  );
}
