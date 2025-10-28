import { supabase } from "@services/supabase";
import {
  registrarMovimiento,
  cargarMovimientos,
} from "@controllers/movimientoController";
import {
  getProducts,
  saveProduct,
  deleteProduct,
  fillProductsSelect,
  parseProductForm,
} from "@controllers/productController";
import { showMessage, $ } from "@utils/helpers";

// =================== ESTADO ===================
let movesVisible = false;

// =================== AUTH ===================

// --- Sign Up ---
$("#btnSignup")?.addEventListener("click", async () => {
  const email = ($("#email") as HTMLInputElement).value.trim();
  const password = ($("#password") as HTMLInputElement).value.trim();
  const { error } = await supabase.auth.signUp({ email, password });
  showMessage(
    "authStatus",
    error ? error.message : "Revisa tu correo para confirmar 📧"
  );
});

// --- Login ---
$("#btnLogin")?.addEventListener("click", async () => {
  const email = ($("#email") as HTMLInputElement).value.trim();
  const password = ($("#password") as HTMLInputElement).value.trim();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showMessage("authStatus", error.message, "error");
  } else {
    showMessage("authStatus", "Sesión iniciada ✅");
    setTimeout(() => {
      window.location.href = "/home.html"; // 👈 redirige al home
    }, 800);
  }
});

// --- Verificar sesión activa ---
supabase.auth.getSession().then(({ data }) => {
  const currentPage = window.location.pathname;

  if (data.session) {
    // Si hay sesión y el usuario está en login, lo mandamos al home
    if (currentPage.includes("login") || currentPage.includes("index")) {
      window.location.href = "/home.html";
    }
  } else {
    // Si NO hay sesión y está en dashboard, redirigir al login
    if (currentPage.includes("home") || currentPage.includes("dashboard")) {
      window.location.href = "/login.html";
    }
  }
});

// =================== PRODUCTOS ===================

async function refreshProducts() {
  try {
    const data = await getProducts();
    renderProducts(data);
  } catch (err: any) {
    showMessage("prodMsg", err.message, "error");
  }
}

document.getElementById("frmProduct")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const product = parseProductForm();
    const msg = await saveProduct(product);
    showMessage("prodMsg", msg);
    await refreshProducts();
    await fillProductsSelect();
  } catch (err: any) {
    showMessage("prodMsg", err.message, "error");
  }
});

document.getElementById("btnLoad")?.addEventListener("click", refreshProducts);

// === Renderizar tabla de productos ===
function renderProducts(list: any[]) {
  const rows = list
    .map(
      (p) => `
    <tr data-id="${p.id}" data-sku="${p.sku}" data-name="${p.name}"
        data-price="${p.price_cents}" data-stock="${p.stock}">
      <td>${p.id}</td>
      <td>${p.sku}</td>
      <td>${p.name}</td>
      <td>₡${(p.price_cents / 100).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btnEdit">Editar</button>
        <button class="btnDelete">Eliminar</button>
      </td>
    </tr>
  `
    )
    .join("");

  $("#productList")!.innerHTML = `
    <table border="1" cellpadding="6">
      <tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
      ${rows}
    </table>
  `;

  document
    .querySelectorAll("#productList .btnEdit")
    .forEach((btn) => btn.addEventListener("click", onEdit as any));
  document
    .querySelectorAll("#productList .btnDelete")
    .forEach((btn) => btn.addEventListener("click", onDelete as any));
}

function onEdit(this: HTMLElement) {
  const tr = this.closest("tr")!;
  ($("#pId") as HTMLInputElement).value = tr.dataset.id!;
  ($("#pSku") as HTMLInputElement).value = tr.dataset.sku!;
  ($("#pName") as HTMLInputElement).value = tr.dataset.name!;
  ($("#pPrice") as HTMLInputElement).value = (
    Number(tr.dataset.price) / 100
  ).toString();
  $("#btnCancelEdit")?.setAttribute("style", "display:inline-block;");
  showMessage("prodMsg", "Editando producto…");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function onDelete(this: HTMLElement) {
  const tr = this.closest("tr")!;
  const id = Number(tr.dataset.id);
  const sku = tr.dataset.sku;
  if (!confirm(`¿Eliminar producto ${sku}? Esta acción no se puede deshacer.`))
    return;
  try {
    const msg = await deleteProduct(id);
    showMessage("prodMsg", msg);
    await refreshProducts();
    await fillProductsSelect();
  } catch (err: any) {
    showMessage("prodMsg", err.message, "error");
  }
}

$("#btnCancelEdit")?.addEventListener("click", () => {
  ($("#frmProduct") as HTMLFormElement).reset();
  showMessage("prodMsg", "");
});

// =================== MOVIMIENTOS ===================
document.getElementById("btnLoadMoves")?.addEventListener("click", async () => {
  movesVisible = true;
  await renderMovimientos();
});

document.getElementById("frmMove")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const productId = Number(
    (document.getElementById("mProduct") as HTMLSelectElement).value
  );
  const tipo = (document.getElementById("mType") as HTMLSelectElement)
    .value as "IN" | "OUT";
  const cantidad = Number(
    (document.getElementById("mQty") as HTMLInputElement).value
  );
  const observacion = (
    document.getElementById("mNote") as HTMLInputElement
  ).value.trim();

  if (!productId || !cantidad || cantidad <= 0) {
    showMessage("moveMsg", "Completa todos los campos", "error");
    return;
  }

  try {
    await registrarMovimiento(productId, tipo, cantidad, observacion);
    showMessage("moveMsg", "Movimiento registrado ✅");
    (document.getElementById("mQty") as HTMLInputElement).value = "";
    (document.getElementById("mNote") as HTMLInputElement).value = "";
    await refreshProducts();
    if (movesVisible) await renderMovimientos();
  } catch (err: any) {
    showMessage("moveMsg", err.message || "Error registrando movimiento", "error");
  }
});

async function renderMovimientos() {
  try {
    const data = await cargarMovimientos();
    const wrap = document.getElementById("movesList")!;
    wrap.innerHTML = `
      <table border="1" cellpadding="6">
        <tr>
          <th>ID</th><th>Tipo</th><th>Producto</th><th>Cantidad</th>
          <th>Fecha</th><th>Observación</th><th>Usuario</th>
        </tr>
        ${data
          .map(
            (m) => `
          <tr>
            <td>${m.id}</td>
            <td>${m.tipo}</td>
            <td>${Array.isArray(m.products) ? (m.products[0]?.name ?? "—") : (m.products?.name ?? "—")}</td>
            <td>${m.cantidad}</td>
            <td>${new Date(m.fecha).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" })}</td>
            <td>${m.observacion || ""}</td>
            <td>${m.usuario_email || "—"}</td>
          </tr>`
          )
          .join("")}
      </table>`;
  } catch (err: any) {
    showMessage("moveMsg", err.message, "error");
  }
}

// =================== INICIO ===================
fillProductsSelect();