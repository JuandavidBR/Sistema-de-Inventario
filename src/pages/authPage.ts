import { supabase } from "@services/supabase";
import { showMessage } from "@utils/helpers";

document.getElementById("showRegister")?.addEventListener("click", () => {
  document.getElementById("loginForm")!.style.display = "none";
  document.getElementById("registerForm")!.style.display = "block";
});

document.getElementById("showLogin")?.addEventListener("click", () => {
  document.getElementById("registerForm")!.style.display = "none";
  document.getElementById("loginForm")!.style.display = "block";
});

document.getElementById("btnLogin")?.addEventListener("click", async () => {
  const email = (document.getElementById("loginEmail") as HTMLInputElement).value.trim();
  const password = (document.getElementById("loginPassword") as HTMLInputElement).value.trim();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showMessage("authStatus", error.message, "error");

  showMessage("authStatus", "Sesión iniciada ✅");
  setTimeout(() => (window.location.href = "dashboard.html"), 1000);
});

document.getElementById("btnSignup")?.addEventListener("click", async () => {
  const email = (document.getElementById("registerEmail") as HTMLInputElement).value.trim();
  const password = (document.getElementById("registerPassword") as HTMLInputElement).value.trim();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return showMessage("authStatus", error.message, "error");

  showMessage("authStatus", "Cuenta creada, revisa tu correo 📧");
});
