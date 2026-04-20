
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fvvmgrtkgblwmulowuki.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function checkSubscribers() {
  const { data, error } = await supabase.from('subscribers').select('*');
  if (error) {
    console.error('Error fetching subscribers:', error);
    return;
  }
  console.log(`Found ${data.length} subscribers.`);
  console.log(JSON.stringify(data, null, 2));
}

checkSubscribers();
