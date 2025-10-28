import { cargarMovimientos } from "@controllers/movimientoController";
import { showMessage } from "@utils/helpers";

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
    showMessage("moveMsg", err.message || "Error cargando movimientos", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderMovimientos();
});
