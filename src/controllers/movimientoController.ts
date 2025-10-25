import { supabase } from "@services/supabase";
import { Movimiento } from "@models/Movimiento";

/** Registrar un nuevo movimiento y actualizar el stock */
export async function registrarMovimiento(
  productId: number,
  tipo: "IN" | "OUT",
  cantidad: number,
  observacion: string
): Promise<void> {
  const { data: prod, error: prodErr } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (prodErr || !prod) throw new Error("Producto no encontrado");
  if (tipo === "OUT" && prod.stock < cantidad) {
    throw new Error(`Stock insuficiente. Disponible: ${prod.stock}`);
  }

  const { data: userData } = await supabase.auth.getUser();
  const usuario_email = userData?.user?.email || "desconocido";

  // 👇 Supabase pondrá automáticamente la fecha UTC actual
  const { error: movErr } = await supabase
    .from("movimientos")
    .insert([{ product_id: productId, tipo, cantidad, usuario_email, observacion }]);

  if (movErr) throw movErr;

  const delta = tipo === "IN" ? cantidad : -cantidad;
  const { error: updErr } = await supabase
    .from("products")
    .update({ stock: prod.stock + delta })
    .eq("id", productId);

  if (updErr) throw updErr;
}

/** Cargar todos los movimientos */
export async function cargarMovimientos(): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select("id, tipo, cantidad, observacion, fecha, usuario_email, products(name)")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data ?? [];
}