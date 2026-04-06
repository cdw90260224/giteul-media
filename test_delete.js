const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables manually to guarantee they match .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

console.log("URL:", supabaseUrl);
console.log("KEY LAST CHARS:", supabaseKey ? supabaseKey.slice(-10) : "MISSING");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
  const { data, error } = await supabase.from('posts').select('id, title');
  if (error) {
    console.error("SELECT ERROR:", error);
    return;
  }
  
  console.log("POSTS:", data);
  
  if (data && data.length > 0) {
    const p = data[0];
    console.log("Deleting id:", p.id);
    const { error: delError } = await supabase.from('posts').delete().eq('id', p.id);
    if (delError) {
      console.error("DELETE ERROR:", delError);
    } else {
      console.log("Deleted successfully! Checking again...");
      const { data: data2 } = await supabase.from('posts').select('id');
      console.log("Remaining POSTS:", data2);
    }
  }
}

testDelete();
