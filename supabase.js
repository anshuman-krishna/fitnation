// Create a supabase.js file (or use your auth page script)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bfvzjitjzhxkexxangip.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdnpqaXRqemh4a2V4eGFuZ2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU3MzkyMzMsImV4cCI6MjAxMTMxNTIzM30.wrIqTEWbc9klOpDngeLXd7jV5cHLGmh2h1d4SUjDfNk";

export const supabase = createClient(supabaseUrl, supabaseKey);