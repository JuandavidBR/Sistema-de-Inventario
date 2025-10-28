import { getProducts } from "@controllers/productController";
import { cargarMovimientos } from "@controllers/movimientoController";
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
  // Navigation buttons
  document.getElementById("btnToProducts")?.addEventListener("click", () => (window.location.href = "productos.html"));
  document.getElementById("btnToEntrada")?.addEventListener("click", () => (window.location.href = "entrada.html"));
  document.getElementById("btnToSalida")?.addEventListener("click", () => (window.location.href = "salida.html"));

  // Auto-load products on home
  await refreshProducts();
  await renderMovimientos();
  document.getElementById("btnViewAllMoves")?.addEventListener("click", () => {
    // Scroll to movimientos list instead of navigating to a separate page
    document.getElementById("movesList")?.scrollIntoView({ behavior: "smooth" });
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
    </tr>
  `
    )
    .join("");

  $("#productList")!.innerHTML = `
    <table border="1" cellpadding="6">
      <tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Precio</th><th>Stock</th></tr>
      ${rows}
    </table>
  `;
}

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
    showMessage("moveMsgIn", err.message || "Error cargando movimientos", "error");
  }
}
