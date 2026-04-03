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
        alert('✨ [발행 성공] 새로운 팩트 리포트가 성공적으로 집필되었습니다!');
        fetchPosts();
      } else {
        // 중복 또는 팩트 부재 시 상세 피드백 
        if (result.error && result.error.includes('NO_NEW_INTELLIGENCE')) {
          alert('🔕 [중복 방지] 현재 모든 최신 공고가 이미 집필되었습니다. 중복 발행을 방지하기 위해 집필을 일시 중단합니다.');
        } else if (result.error && result.error.includes('DATA_MISSING_ERROR')) {
          alert('❌ [팩트 부재] 수집된 공고 데이터에 오류가 있습니다. 할루시네이션(망상) 방지를 위해 작업을 중단합니다.');
        } else {
          alert('⚠️ [발행 오류] ' + (result.error || '알 수 없는 오류가 발생했습니다.'));
        }
      }
    } catch (e) {
      alert('🚫 [연결 오류] 서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('데이터를 영구 삭제하시겠습니까? (삭제된 정보는 복구할 수 없습니다)')) return;
    try {
      const res = await fetch('/api/delete-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await res.json();
      
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
        alert('🗑️ [삭제 완료] 정보가 성공적으로 폐기되었습니다.');
      } else {
        // 권한 관련 에러 피드백 강화 
        if (result.error && result.error.includes('Key not found')) {
          alert('🔒 [권한 오류] .env.local에 SERVICE_ROLE_KEY가 설정되지 않아 삭제가 거부되었습니다. 관리자에게 문의하세요.');
        } else {
          alert('❌ [삭제 실패] ' + (result.error || '데이터베이스 정책(RLS) 파기 오류입니다.'));
        }
      }
    } catch (e: any) {
      alert('🚫 [시스템 오류] 삭제 명령 수행 중 시스템 충돌이 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-40">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 py-6 px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-black text-deep-navy italic tracking-tighter">기틀.</Link>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Control Hub</span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={handleGenerate}
                disabled={generating}
                className={`bg-deep-navy text-white px-6 py-2.5 rounded-full text-[10px] font-black shadow-xl tracking-widest transition-all ${
                    generating ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'
                }`}
            >
                {generating ? '집필 중...' : '🔥 새 기사 집필 시작'}
            </button>
            <Link href="/" className="text-[10px] font-black text-slate-300 hover:text-deep-navy tracking-widest uppercase">Portal Exit</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20">
        <header className="mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Contents.</h2>
            <p className="text-slate-400 font-bold text-sm">현재 발행된 인텔리전스 리포트 목록입니다. 제목을 눌러 바로 확인하세요.</p>
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
                                className="text-[10px] font-black text-red-300 hover:text-white hover:bg-red-500 bg-red-50/50 px-5 py-2.5 rounded-xl transition-all"
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
