
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fvvmgrtkgblwmulowuki.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function checkTables() {
  // Supabase doesn't have a direct way to list tables via JS client without RLS/admin access to pg_catalog,
  // but we can try to query a 'logs' table to see if it exists.
  const { data, error } = await supabase.from('logs').select('*').limit(1);
  if (error) {
    console.log('Logs table might not exist or error:', error.message);
  } else {
    console.log('Logs table exists. Data:', data);
  }
}

checkTables();
