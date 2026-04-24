const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDeadlines() {
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, deadline_date, summary, content, notice_url')
        .eq('id', 203)
        .maybeSingle();

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkDeadlines();
