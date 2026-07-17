import { createClient } from '@supabase/supabase-js';

const envUrl = 'https://vgcarfflqjfbrevfnlyd.supabase.co';
const envAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnY2FyZmZscWpmYnJldmZubHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzU3MjIsImV4cCI6MjA5ODQxMTcyMn0.zc2yUKz7_6h-6_Mxw9MmMTatZ1lb1PwUvjGiai8Q2DU';

const supabase = createClient(envUrl, envAnonKey);

async function checkRLS() {
  console.log('Querying pg_tables and rls...');
  // Since we are using standard REST api, let's check if we can run an RPC or simple queries, 
  // or we can query using postgrest on some system views if allowed.
  const { data, error } = await supabase.rpc('get_policies_status');
  console.log('RPC result:', data, error);

  // Let's also do a select with standard auth to see if we get RLS errors
  console.log('Doing select from employees...');
  const { data: selectData, error: selectErr } = await supabase.from('employees').select('*');
  console.log('Select result:', selectData ? `${selectData.length} rows` : 'no data', selectErr);
}

checkRLS();
