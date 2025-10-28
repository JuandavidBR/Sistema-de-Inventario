import { getProducts, saveProduct, deleteProduct, parseProductForm, fillProductsSelect } from "@controllers/productController";
import { showMessage, $ } from "@utils/helpers";

async function refreshProducts() {
  try {
    const data = await getProducts();
    renderProducts(data);
  } catch (err: any) {
    showMessage("prodMsg", err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Do not auto-load products on page load. Require user to click "Cargar productos".
  $("#productList")!.innerHTML = `<p>Presiona "Cargar productos" para ver la lista.</p>`;

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

  // Wire the load button to fetch products on demand
  document.getElementById("btnLoad")?.addEventListener("click", async () => {
    // Provide immediate feedback
    $("#productList")!.innerHTML = `<p>Cargando productos…</p>`;
    await refreshProducts();
  });

  document.getElementById("btnCancelEdit")?.addEventListener("click", () => {
    (document.getElementById("frmProduct") as HTMLFormElement).reset();
    showMessage("prodMsg", "");
  });
});

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

  document.querySelectorAll("#productList .btnEdit").forEach((btn) => btn.addEventListener("click", onEdit as any));
  document.querySelectorAll("#productList .btnDelete").forEach((btn) => btn.addEventListener("click", onDelete as any));
}

function onEdit(this: HTMLElement) {
  const tr = this.closest("tr")!;
  (document.getElementById("pId") as HTMLInputElement).value = tr.dataset.id!;
  (document.getElementById("pSku") as HTMLInputElement).value = tr.dataset.sku!;
  (document.getElementById("pName") as HTMLInputElement).value = tr.dataset.name!;
  (document.getElementById("pPrice") as HTMLInputElement).value = (Number(tr.dataset.price) / 100).toString();
  document.getElementById("btnCancelEdit")?.setAttribute("style", "display:inline-block;");
  showMessage("prodMsg", "Editando producto…");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function onDelete(this: HTMLElement) {
  const tr = this.closest("tr")!;
  const id = Number(tr.dataset.id);
  const sku = tr.dataset.sku;
  if (!confirm(`¿Eliminar producto ${sku}? Esta acción no se puede deshacer.`)) return;
  try {
    const msg = await deleteProduct(id);
    showMessage("prodMsg", msg);
    await refreshProducts();
    await fillProductsSelect();
  } catch (err: any) {
    showMessage("prodMsg", err.message, "error");
  }
}
