import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ArticleDetailClient from './ArticleDetailClient';

// [1. 동적 메타데이터 엔진 - Next.js 15/16 호환]
export async function generateMetadata(
  // Next.js 15+ 에서는 params가 Promise 객체입니다.
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
  
  if (!post) return { title: 'Intelligence Missing | Giteul' };

  return {
    title: `${post.title} | 기틀 미디어 전략 리포트`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [{ url: post.image_url }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [post.image_url],
    },
  };
}

// Server Component Wrapper (Promise type for params)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleDetailClient id={id} />;
}
