const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkDomains() {
    const { data: posts } = await supabase
        .from('posts')
        .select('notice_url')
        .eq('category', '정부지원공고');

    if (!posts) return;

    const domains = {};
    posts.forEach(p => {
        try {
            const url = new URL(p.notice_url || '');
            const domain = url.hostname;
            domains[domain] = (domains[domain] || 0) + 1;
        } catch (e) {
            domains['invalid'] = (domains['invalid'] || 0) + 1;
        }
    });

    console.log('--- Support Announcement Domains ---');
    console.log(JSON.stringify(domains, null, 2));
    console.log('Total Count:', posts.length);
}

checkDomains();
