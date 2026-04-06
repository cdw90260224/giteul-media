'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminWritePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    category: '정부지원',
    content: '',
    notice_url: '',
    image_url: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from('posts').insert([payload]).select();
      
      if (error) {
        throw error;
      }
      
      alert('✨ [발행 성공] 수동으로 기사가 발행되었습니다!');
      router.push('/admin');
    } catch (err: any) {
      alert('❌ [발행 오류] ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-40">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 py-6 px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-black text-deep-navy italic tracking-tighter">기틀.</Link>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Manual Write</span>
        </div>
        <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[10px] font-black text-slate-300 hover:text-deep-navy tracking-widest uppercase transition-all mr-4">← Back to Admin</Link>
            <button 
                onClick={handleSubmit}
                disabled={saving}
                className={`bg-deep-navy text-white px-6 py-2.5 rounded-full text-[10px] font-black shadow-xl tracking-widest transition-all ${
                    saving ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'
                }`}
            >
                {saving ? '저장 중...' : '🔥 수동 기사 발행하기'}
            </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <header className="mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">New Article.</h2>
            <p className="text-slate-400 font-bold text-sm">기사를 직접 작성하거나 외부 리포트를 수동으로 업로드할 수 있습니다.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-[35px] border border-gray-100 shadow-xl">
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="예: 2026 딥테크 챌린지 합격 전략 가이드" 
              className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-deep-navy/20 transition-all text-slate-800 placeholder-slate-300"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Summary</label>
            <textarea 
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              placeholder="리스트에 보여질 짧은 요약문 (1-2줄)" 
              className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-deep-navy/20 transition-all text-slate-800 placeholder-slate-300 resize-none h-24"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-deep-navy/20 transition-all text-slate-800"
              >
                <option value="정부지원">정부지원사업</option>
                <option value="B2B 트렌드">B2B 트렌드</option>
                <option value="스타트업 공고">스타트업 공고</option>
                <option value="인사이트">인사이트</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Cover Image URL</label>
              <input 
                type="text" 
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                placeholder="https://..." 
                className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-deep-navy/20 transition-all text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Official Notice URL</label>
            <input 
              type="text" 
              value={formData.notice_url}
              onChange={(e) => setFormData({...formData, notice_url: e.target.value})}
              placeholder="https://www.iris.go.kr/... (존재할 경우 입력)" 
              className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-deep-navy/20 transition-all text-slate-800 placeholder-slate-300"
            />
          </div>
          
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Content (HTML)</label>
            <textarea 
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="본문 내용을 입력하세요 (HTML 태그 지원)" 
              className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-deep-navy/20 transition-all text-slate-800 placeholder-slate-300 resize-none h-64 font-mono text-xs"
              required
            ></textarea>
          </div>
        </form>
      </main>
    </div>
  );
}
