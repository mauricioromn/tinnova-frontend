// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🔥 Validación estricta (evita pantalla en blanco)
if (!supabaseUrl) {
  throw new Error("❌ VITE_SUPABASE_URL no está definida. Revísala en Vercel y en .env local.");
}

if (!supabaseAnonKey) {
  throw new Error("❌ VITE_SUPABASE_ANON_KEY no está definida. Revísala en Vercel y en .env local.");
}

export const supabase = createClient(String(supabaseUrl), String(supabaseAnonKey));
