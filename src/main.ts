import { supabase } from "./services/supabase";

const $ = (s: string) => document.querySelector(s) as HTMLElement;

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

$("#btnLoad")?.addEventListener("click", async () => {
  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, price_cents, stock")
    .order("id");
  if (error) { $("#productList").textContent = error.message; return; }

  $("#productList").innerHTML = `
    <table border="1" cellpadding="6">
      <tr><th>ID</th><th>SKU</th><th>Nombre</th><th>Precio</th><th>Stock</th></tr>
      ${data!.map(p => `
        <tr>
          <td>${p.id}</td>
          <td>${p.sku}</td>
          <td>${p.name}</td>
          <td>₡${(p.price_cents/100).toFixed(2)}</td>
          <td>${p.stock}</td>
        </tr>`).join("")}
    </table>`;
});

// Mostrar estado si ya hay sesión
supabase.auth.getSession().then(({ data }) => {
  if (data.session) $("#authStatus").textContent = "Sesión activa ✅";
});
