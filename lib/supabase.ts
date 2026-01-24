import { createClient } from '@supabase/supabase-js';

// Intentar obtener de varias fuentes comunes en Vite/Replit
const supabaseUrl = process.env.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Please set SUPABASE_URL and SUPABASE_ANON_KEY in Replit Secrets.');
}

// Solo crear el cliente si las credenciales parecen válidas (contienen http)
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
