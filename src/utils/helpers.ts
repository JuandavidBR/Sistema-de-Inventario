export const $ = (selector: string): HTMLElement | null =>
  document.querySelector(selector);

export function showMessage(id: string, msg: string, type: "ok" | "error" = "ok") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === "ok" ? "green" : "red";
}
