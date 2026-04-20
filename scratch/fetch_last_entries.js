
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fvvmgrtkgblwmulowuki.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function getLastEntries() {
  console.log(`Fetching last 10 posts...`);

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, category, created_at, notice_url')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

getLastEntries();
