import { createClient } from "@supabase/supabase-js";

// ✅ Usa variables de entorno que Vite carga automáticamente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ✅ Crea el cliente con sesión persistente (para que recuerde el login)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
});
