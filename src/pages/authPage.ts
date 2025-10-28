import { supabase } from "@services/supabase";
import { showMessage } from "@utils/helpers";

// This auth page uses a single pair of inputs (email, password) and toggles
// which action the user will take (login or signup) via the buttons shown
// by the inline tab script in `login.html`.

document.getElementById("btnLogin")?.addEventListener("click", async () => {
  const emailEl = document.getElementById("email") as HTMLInputElement | null;
  const passEl = document.getElementById("password") as HTMLInputElement | null;
  const email = emailEl?.value.trim() ?? "";
  const password = passEl?.value.trim() ?? "";

  if (!email || !password) {
    return showMessage("authStatus", "Completa correo y contraseña", "error");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showMessage("authStatus", error.message, "error");

  showMessage("authStatus", "Sesión iniciada ✅");
  setTimeout(() => (window.location.href = "home.html"), 800);
});

document.getElementById("btnSignup")?.addEventListener("click", async () => {
  const emailEl = document.getElementById("email") as HTMLInputElement | null;
  const passEl = document.getElementById("password") as HTMLInputElement | null;
  const email = emailEl?.value.trim() ?? "";
  const password = passEl?.value.trim() ?? "";

  if (!email || !password) {
    return showMessage("authStatus", "Completa correo y contraseña", "error");
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return showMessage("authStatus", error.message, "error");

  showMessage("authStatus", "Cuenta creada, revisa tu correo 📧");
});
