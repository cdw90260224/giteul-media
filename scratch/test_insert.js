const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function testInsert() {
    const { error } = await supabase.from('posts').insert([{
        title: 'Test Title ' + Date.now(),
        summary: 'Test Summary',
        content: 'Test Content',
        category: '정부지원공고',
        notice_url: 'https://test.com/news/' + Date.now(),
        image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
        created_at: new Date().toISOString()
    }]);
    
    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success!');
    }
}

testInsert();
