import { supabase } from "./services/supabase";

const $ = (s: string) => document.querySelector(s) as HTMLElement;

let movesVisible = false;

document.getElementById("btnLoadMoves")?.addEventListener("click", async () => {
  await cargarMovimientos();
  movesVisible = true;
});

// Helpers
const parseMoneyToCents = (s: string) => {
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Math.round((isNaN(n) ? 0 : n) * 100);
};
const validateSKU = (sku: string) => /^[A-Z0-9\-]{3,}$/.test(sku);

// ===== MOVIMIENTOS: helpers UI =====
function setMoveMsg(msg: string) {
  const el = document.getElementById("moveMsg");
  if (el) el.textContent = msg;
}

// Rellena el <select> con los productos (para el formulario de movimientos)
async function fillProductsSelect() {
  const sel = document.getElementById("mProduct") as HTMLSelectElement | null;
  if (!sel) return;

  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku")
    .order("name");

  if (error) { sel.innerHTML = `<option>Error: ${error.message}</option>`; return; }
  sel.innerHTML = (data ?? [])
    .map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`)
    .join("");
}


// Auth
$("#btnSignup")?.addEventListener("click", async () => {
  const email = ( $("#email") as HTMLInputElement ).value.trim();
  const password = ( $("#password") as HTMLInputElement ).value.trim();
  const { error } = await supabase.auth.signUp({ email, password });
  $("#authStatus").textContent = error ? error.message : "Revisa tu correo para confirmar 📧";
});

document.getElementById("frmMove")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMoveMsg("");

  const productId = Number((document.getElementById("mProduct") as HTMLSelectElement).value);
  const tipo = (document.getElementById("mType") as HTMLSelectElement).value as "IN" | "OUT";
  const cantidad = Number((document.getElementById("mQty") as HTMLInputElement).value);
  const observacion = (document.getElementById("mNote") as HTMLInputElement).value.trim();

  if (!productId || !cantidad || cantidad <= 0) {
    setMoveMsg("Completa todos los campos");
    return;
  }

  try {
    await registrarMovimiento(productId, tipo, cantidad, observacion);
    setMoveMsg("Movimiento registrado ✅");

    // limpiar inputs
    (document.getElementById("mQty") as HTMLInputElement).value = "";
    (document.getElementById("mNote") as HTMLInputElement).value = "";

    // refrescar productos para ver el nuevo stock
    await refreshProducts();
    if (movesVisible) await cargarMovimientos();
  } catch (err: any) {
    setMoveMsg(err.message || "Error registrando movimiento");
  }
});


$("#btnLogin")?.addEventListener("click", async () => {
  const email = ( $("#email") as HTMLInputElement ).value.trim();
  const password = ( $("#password") as HTMLInputElement ).value.trim();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  $("#authStatus").textContent = error ? error.message : "Sesión iniciada ✅";
});

supabase.auth.getSession().then(({ data }) => {
  if (data.session) $("#authStatus").textContent = "Sesión activa ✅";
});

fillProductsSelect();


// ---------------- LISTAR + RENDER ----------------
async function refreshProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, price_cents, stock")
    .order("id");

  if (error) {
    $("#productList").textContent = error.message;
    return;
  }
  render(data ?? []);
}

function render(list: any[]) {
  const rows = list.map(p => `
    <tr data-id="${p.id}" data-sku="${p.sku}" data-name="${p.name}" data-price="${p.price_cents}" data-stock="${p.stock}">
      <td>${p.id}</td>
      <td>${p.sku}</td>
      <td>${p.name}</td>
      <td>₡${(p.price_cents/100).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btnEdit">Editar</button>
        <button class="btnDelete">Eliminar</button>
      </td>
    </tr>
  `).join("");

  $("#productList").innerHTML = `
    <table border="1" cellpadding="6">
      <tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
      ${rows}
    </table>
  `;

  // acciones
  document.querySelectorAll("#productList .btnEdit")
    .forEach(b => b.addEventListener("click", onEdit as any));
  document.querySelectorAll("#productList .btnDelete")
    .forEach(b => b.addEventListener("click", onDelete as any));
}

document.querySelector("#btnLoad")?.addEventListener("click", refreshProducts);

// ===== MOVIMIENTOS: registrar y aplicar al stock =====
async function registrarMovimiento(
  productId: number,
  tipo: "IN" | "OUT",
  cantidad: number,
  observacion: string
) {
  // 1) Traer stock actual para validar OUT
  const { data: prod, error: prodErr } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (prodErr || !prod) throw new Error("Producto no encontrado");
  if (tipo === "OUT" && prod.stock < cantidad) {
    throw new Error(`Stock insuficiente. Disponible: ${prod.stock}`);
  }

  // 2) Insertar movimiento
  const { data: userData } = await supabase.auth.getUser();
  const usuario_email = userData?.user?.email || "desconocido";

  const { error: movErr } = await supabase
    .from("movimientos")
    .insert([{ product_id: productId, tipo, cantidad, usuario_email, observacion }]);

  if (movErr) throw movErr;

  // 3) Actualizar stock
  const delta = tipo === "IN" ? cantidad : -cantidad;
  const { error: updErr } = await supabase
    .from("products")
    .update({ stock: prod.stock + delta })
    .eq("id", productId);

  if (updErr) throw updErr;
}


// ---------------- FORM: GUARDAR / CANCELAR ----------------
function setFormMsg(msg: string) { const el = $("#prodMsg"); if (el) el.textContent = msg; }

function clearForm() {
  const pId    = document.getElementById("pId")    as HTMLInputElement | null;
  const pSku   = document.getElementById("pSku")   as HTMLInputElement | null;
  const pName  = document.getElementById("pName")  as HTMLInputElement | null;
  const pPrice = document.getElementById("pPrice") as HTMLInputElement | null;
  const pStock = document.getElementById("pStock") as HTMLInputElement | null;
  const btnCancel = document.getElementById("btnCancelEdit") as HTMLButtonElement | null;

  if (pId)    pId.value = "";
  if (pSku)   pSku.value = "";
  if (pName)  pName.value = "";
  if (pPrice) pPrice.value = "";
  if (pStock) pStock.value = "";
  if (btnCancel) btnCancel.style.display = "inline-block";
  setFormMsg("");
}


async function saveProduct(e: Event) {
  e.preventDefault();
  const id = Number(( $("#pId") as HTMLInputElement ).value || 0);
  const sku = ( $("#pSku") as HTMLInputElement ).value.trim().toUpperCase();
  const name = ( $("#pName") as HTMLInputElement ).value.trim();
  const price_cents = parseMoneyToCents(( $("#pPrice") as HTMLInputElement ).value);
  const stockStr = ( $("#pStock") as HTMLInputElement ).value.trim();
  const stock = stockStr ? Math.max(0, Number(stockStr)) : undefined;

  if (!validateSKU(sku)) { setFormMsg("SKU inválido (usa MAYÚSCULAS, números y -)"); return; }
  if (!name) { setFormMsg("Nombre requerido"); return; }
  if (price_cents < 0) { setFormMsg("Precio inválido"); return; }

  try {
    if (id) {
      const upd: any = { sku, name, price_cents };
      if (stock !== undefined && !isNaN(stock)) upd.stock = stock;
      const { error } = await supabase.from("products").update(upd).eq("id", id);
      if (error) throw error;
      setFormMsg("Producto actualizado ✅");
    } else {
      const payload: any = { sku, name, price_cents };
      if (stock !== undefined && !isNaN(stock)) payload.stock = stock;
      const { error } = await supabase.from("products").insert([payload]);
      if (error) throw error;
      setFormMsg("Producto creado ✅");
    }
    await refreshProducts();
    await fillProductsSelect(); 
    if (typeof cargarMovimientos === "function") await cargarMovimientos();
clearForm();
    if (movesVisible) await cargarMovimientos();
    clearForm();
  } catch (err: any) {
    setFormMsg(err.message || "Error guardando");
  }
}

$("#frmProduct")?.addEventListener("submit", saveProduct);
$("#btnCancelEdit")?.addEventListener("click", clearForm);

// ---------------- ACCIONES: EDITAR / ELIMINAR ----------------
function onEdit(this: Element) {
  const tr = (this as HTMLElement).closest("tr")!;
  ( $("#pId") as HTMLInputElement ).value = tr.getAttribute("data-id")!;
  ( $("#pSku") as HTMLInputElement ).value = tr.getAttribute("data-sku")!;
  ( $("#pName") as HTMLInputElement ).value = tr.getAttribute("data-name")!;
  ( $("#pPrice") as HTMLInputElement ).value = (Number(tr.getAttribute("data-price"))/100).toString();
  ( $("#pStock") as HTMLInputElement ).value = tr.getAttribute("data-stock")!;
  $("#btnCancelEdit")?.setAttribute("style", "display:inline-block;");
  setFormMsg("Editando…");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function onDelete(this: Element) {
  const tr = (this as HTMLElement).closest("tr")!;
  const id = Number(tr.getAttribute("data-id"));
  const sku = tr.getAttribute("data-sku");
  if (!confirm(`¿Eliminar producto ${sku}? Esta acción no se puede deshacer.`)) return;
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    setFormMsg(`Producto ${sku} eliminado ✅`);
    await refreshProducts();
    await fillProductsSelect();
    if (typeof cargarMovimientos === "function") await cargarMovimientos();
clearForm();
    if (movesVisible) await cargarMovimientos();
    clearForm();
  } catch (err: any) {
    setFormMsg(err.message || "Error eliminando");
  }
}
async function cargarMovimientos() {
  const { data, error } = await supabase
    .from("movimientos")
    .select("id, tipo, cantidad, observacion, fecha, usuario_email, products(name)")
    .order("fecha", { ascending: false });

  const wrap = document.getElementById("movesList") as HTMLElement;
  if (error) { wrap.textContent = error.message; return; }

wrap.innerHTML = `
<table border="1" cellpadding="6">
<tr>
<th>ID</th>
<th>Tipo</th>
<th>Producto</th>
<th>Cantidad</th>
<th>Fecha</th>
<th>Observación</th>
<th>Usuario</th>
</tr>

    ${(data ?? []).map((m: any) => `
  <tr>
    <td>${m.id}</td>
    <td>${m.tipo}</td>
    <td>${m.products?.name || "—"}</td>
    <td>${m.cantidad}</td>
    <td>${new Date(m.fecha).toLocaleString()}</td>
    <td>${m.observacion || ""}</td>
    <td>${m.usuario_email || "—"}</td>
  </tr>
`).join("")}

    </table>
  `;
}

document.getElementById("btnLoadMoves")?.addEventListener("click", cargarMovimientos);




