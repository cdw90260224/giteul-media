import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { fetchExternalNews } from './src/lib/news-api';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

async function manualPublish(category: string) {
    console.log(`Manual publishing for: ${category}`);
    const articles = await fetchExternalNews(category);
    console.log(`Found ${articles.length} articles`);
    
    for (const a of articles.slice(0, 3)) {
        console.log(`Publishing: ${a.title}`);
        const postData = {
            title: a.title,
            summary: `[${category}] ${a.description.slice(0, 100)}...`,
            category: category,
            content: a.content || a.description,
            notice_url: a.url,
            image_url: a.image || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
            created_at: new Date().toISOString()
        };
        const { error } = await adminClient.from('posts').insert([postData]);
        if (error) console.error('Insert error:', error);
        else console.log('Successfully inserted!');
    }
}

manualPublish('AI/테크 트렌드');
