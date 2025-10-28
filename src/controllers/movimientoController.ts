import { supabase } from "@services/supabase";
import type { Movimiento } from "@models/Movimiento";

/**
 * Registrar un nuevo movimiento y actualizar el stock
 */
export async function registrarMovimiento(
  productId: number,
  tipo: "IN" | "OUT",
  cantidad: number,
  observacion: string
): Promise<void> {
  // 1️⃣ Verificar producto
  const { data: prod, error: prodErr } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (prodErr || !prod) throw new Error("Producto no encontrado");

  // 2️⃣ Validar stock si es salida
  if (tipo === "OUT" && prod.stock < cantidad) {
    throw new Error(`Stock insuficiente. Disponible: ${prod.stock}`);
  }

  // 3️⃣ Obtener usuario logueado
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) console.warn("No se pudo obtener usuario activo:", userErr);
  const usuario_email = userData?.user?.email ?? "desconocido";

  // 4️⃣ Generar fecha en UTC exacta (compatible con timestamptz)
  const fechaUTC = new Date().toISOString();

  // 5️⃣ Insertar movimiento en la base
  const { error: movErr } = await supabase
    .from("movimientos")
    .insert([
      {
        product_id: productId,
        tipo,
        cantidad,
        observacion,
        usuario_email,
        fecha: fechaUTC,
      },
    ]);

  if (movErr) throw new Error(`Error al registrar movimiento: ${movErr.message}`);

  // 6️⃣ Actualizar stock del producto
  const nuevoStock = tipo === "IN" ? prod.stock + cantidad : prod.stock - cantidad;
  const { error: updErr } = await supabase
    .from("products")
    .update({ stock: nuevoStock })
    .eq("id", productId);

  if (updErr) throw new Error(`Error al actualizar stock: ${updErr.message}`);
}

/**
 * Cargar todos los movimientos
 */
export async function cargarMovimientos(): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      observacion,
      fecha,
      usuario_email,
      products(name)
    `)
    .order("fecha", { ascending: false });

  if (error) throw new Error(`Error cargando movimientos: ${error.message}`);
  return data ?? [];
}