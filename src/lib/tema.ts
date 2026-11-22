/**
 * Modo claro / oscuro.
 *
 * La preferencia se guarda en el dispositivo (localStorage "tema"): "claro", "oscuro" o "auto".
 * "auto" sigue la configuración del celular o la computadora. Es lo que ve todo el mundo
 * por defecto, incluidos los clientes que abren un presupuesto.
 */

export type Tema = "claro" | "oscuro" | "auto";
export const CLAVE_TEMA = "tema";
export const EVENTO_TEMA = "laburo:tema";
/** Fondo de la barra de arriba de la app (--color-superficie) en cada tema. */
export const COLOR_BARRA = { claro: "#ffffff", oscuro: "#171f2f" };

/**
 * Corre en el <head> antes de pintar: evita el parpadeo blanco al abrir en modo oscuro.
 * Además sigue los cambios del sistema en modo "auto" y siempre imprime en claro.
 */
export const SCRIPT_TEMA = `(function () {
  var d = document.documentElement;
  var m = window.matchMedia("(prefers-color-scheme: dark)");
  function aplicar() {
    var t = "auto";
    try { t = localStorage.getItem("${CLAVE_TEMA}") || "auto"; } catch (e) {}
    d.dataset.tema = t === "oscuro" || (t === "auto" && m.matches) ? "oscuro" : "claro";
    color();
  }
  // Color de la barra del celular (la de la hora y la batería): igual al de la barra de arriba de la app.
  function color() {
    if (!document.head) return;
    var meta = document.getElementById("color-barra");
    if (!meta) {
      meta = document.createElement("meta");
      meta.id = "color-barra";
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = d.dataset.tema === "oscuro" ? "${COLOR_BARRA.oscuro}" : "${COLOR_BARRA.claro}";
  }
  aplicar();
  if (m.addEventListener) m.addEventListener("change", aplicar);
  window.addEventListener("${EVENTO_TEMA}", aplicar);
  window.addEventListener("storage", aplicar);
  window.addEventListener("beforeprint", function () { d.dataset.tema = "claro"; });
  window.addEventListener("afterprint", aplicar);
  document.addEventListener("DOMContentLoaded", color);
})();`;
