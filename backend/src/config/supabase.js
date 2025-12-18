require('dotenv').config({ path: 'backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Key in .env');
  process.exit(1);
}

// this client has admin privileges (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
