const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fvvmgrtkgblwmulowuki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
);

async function clearAll() {
  console.log('Deleting all posts from database...');
  const { error } = await supabase.from('posts').delete().gt('id', 0);
  if (error) console.error(error);
  else console.log('Database cleared.');
}

clearAll();
