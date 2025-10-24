import { supabase } from "./services/supabase";

const $ = (s: string) => document.querySelector(s) as HTMLElement;

// Helpers
const parseMoneyToCents = (s: string) => {
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Math.round((isNaN(n) ? 0 : n) * 100);
};
const validateSKU = (sku: string) => /^[A-Z0-9\-]{3,}$/.test(sku);

// Auth
$("#btnSignup")?.addEventListener("click", async () => {
  const email = ( $("#email") as HTMLInputElement ).value.trim();
  const password = ( $("#password") as HTMLInputElement ).value.trim();
  const { error } = await supabase.auth.signUp({ email, password });
  $("#authStatus").textContent = error ? error.message : "Revisa tu correo para confirmar 📧";
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
    clearForm();
  } catch (err: any) {
    setFormMsg(err.message || "Error eliminando");
  }
}
