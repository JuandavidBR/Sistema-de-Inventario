import { fillProductsSelect } from "@controllers/productController";
import { registrarMovimiento } from "@controllers/movimientoController";
import { showMessage } from "@utils/helpers";

// Llenar select y manejar submit para entradas (IN)
document.addEventListener("DOMContentLoaded", async () => {
  await fillProductsSelect();

  const frm = document.getElementById("frmMove") as HTMLFormElement | null;
  frm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const productId = Number((document.getElementById("mProduct") as HTMLSelectElement).value);
    const cantidad = Number((document.getElementById("mQty") as HTMLInputElement).value);
    const observacion = (document.getElementById("mNote") as HTMLInputElement).value.trim();

    if (!productId || !cantidad || cantidad <= 0) {
      showMessage("moveMsg", "Completa todos los campos", "error");
      return;
    }

    try {
      await registrarMovimiento(productId, "IN", cantidad, observacion);
      showMessage("moveMsg", "Entrada registrada ✅");
      (document.getElementById("mQty") as HTMLInputElement).value = "";
      (document.getElementById("mNote") as HTMLInputElement).value = "";
    } catch (err: any) {
      showMessage("moveMsg", err.message || "Error registrando entrada", "error");
    }
  });
});
