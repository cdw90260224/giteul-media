
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Manually parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim();
    }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const SERVICE_ROLE = env['SUPABASE_SERVICE_ROLE_KEY'] || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function cleanImageUrls() {
  console.log('Cleaning up image URLs for maximum compatibility...');
  const { data: posts, error } = await supabase.from('posts').select('id, title, image_url, category');
  if (error) return;

  for (const post of posts) {
    let newUrl = post.image_url;
    
    // If URL is missing or looks like an old auto-generated one with comma issues
    if (!newUrl || newUrl.includes(',')) {
        const seed = Math.floor(Math.random() * 1000);
        const keyword = post.category === '정부지원공고' ? 'business' : 'technology';
        // Use a clean, robust Unsplash URL pattern
        newUrl = `https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop&sig=${seed}`;
        
        await supabase.from('posts').update({ image_url: newUrl }).eq('id', post.id);
        console.log(`Reset URL for: ${post.title}`);
    }
  }
  console.log('Image URL cleanup finished.');
}

cleanImageUrls();
