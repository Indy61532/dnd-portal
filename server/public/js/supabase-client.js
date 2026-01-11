import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TODO: Vyplň své hodnoty ze Supabase Dashboardu (Project Settings → API)
// - SUPABASE_URL: https://TVUJ-PROJEKT.supabase.co
// - SUPABASE_ANON_KEY: veřejný anon key
const SUPABASE_URL = "https://bvrwvtkiuveksfhkckke.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cnd2dGtpdXZla3NmaGtja2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTgyMzMsImV4cCI6MjA4MTA5NDIzM30.Q7ynf85AcUylUupsgG6c7_pS6P6cQ5-oo4z5zfyd3Qc";

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


