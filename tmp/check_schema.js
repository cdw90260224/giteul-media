const { createClient } = require('@supabase/supabase-js');

async function checkAllFields() {
  const supabase = createClient(
    'https://fvvmgrtkgblwmulowuki.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
  );

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log('--- Table Schema Check (Single Item) ---');
  console.log(Object.keys(data[0]));
}

checkAllFields();
