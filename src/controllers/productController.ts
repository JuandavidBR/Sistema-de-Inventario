import { supabase } from "@services/supabase";
import type { Product } from "@models/Product";
import { parseMoneyToCents } from "@utils/formatters";
import { validateSKU } from "@utils/validators";

/** === Crear o actualizar producto === */
export async function saveProduct(
  product: Partial<Product>
): Promise<string> {
  const { id, sku, name, price_cents } = product;

  if (!sku || !validateSKU(sku)) throw new Error("SKU inválido (usa MAYÚSCULAS, números y '-')");
  if (!name) throw new Error("Nombre requerido");
  if (price_cents == null || price_cents < 0) throw new Error("Precio inválido");

  if (id) {
    // When updating product metadata we do NOT modify stock here. Stock
    // must be changed only via movimientos (entradas/salidas).
    const { error } = await supabase.from("products").update({
      sku,
      name,
      price_cents,
    }).eq("id", id);
    if (error) throw error;
    return "Producto actualizado ✅";
  } else {
    // New products start with zero stock. Stock adjustments must be made
    // through 'entradas' (movimientos of type IN).
    const { error } = await supabase.from("products").insert([{
      sku,
      name,
      price_cents,
      stock: 0,
    }]);
    if (error) throw error;
    return "Producto creado ✅";
  }
}

/** === Eliminar producto === */
export async function deleteProduct(id: number): Promise<string> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return "Producto eliminado ✅";
}

/** === Listar productos === */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, price_cents, stock")
    .order("id");
  if (error) throw error;
  return data ?? [];
}

/** === Llenar el <select> de productos para movimientos === */
export async function fillProductsSelect(): Promise<void> {
  const sel = document.getElementById("mProduct") as HTMLSelectElement | null;
  if (!sel) return;

  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku")
    .order("name");

  if (error) {
    sel.innerHTML = `<option>Error: ${error.message}</option>`;
    return;
  }

  sel.innerHTML = (data ?? [])
    .map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`)
    .join("");
}

/** === Parsear datos del formulario antes de guardar === */
export function parseProductForm(): Partial<Product> {
  const id = Number((document.getElementById("pId") as HTMLInputElement).value || 0);
  const sku = (document.getElementById("pSku") as HTMLInputElement).value.trim().toUpperCase();
  const name = (document.getElementById("pName") as HTMLInputElement).value.trim();
  const priceInput = (document.getElementById("pPrice") as HTMLInputElement).value;
  const price_cents = parseMoneyToCents(priceInput);
  return { id, sku, name, price_cents };
}
