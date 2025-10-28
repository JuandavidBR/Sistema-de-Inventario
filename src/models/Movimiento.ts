export interface Movimiento {
  id: number;
  tipo: "IN" | "OUT";
  cantidad: number;
  observacion: string | null;
  fecha: string;
  usuario_email: string | null;
  // Supabase relationship can return an array of related rows or a single object depending on the query
  products?: { name: string } | { name: string }[];
}
