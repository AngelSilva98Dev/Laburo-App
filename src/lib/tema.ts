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
  }
  aplicar();
  if (m.addEventListener) m.addEventListener("change", aplicar);
  window.addEventListener("${EVENTO_TEMA}", aplicar);
  window.addEventListener("storage", aplicar);
  window.addEventListener("beforeprint", function () { d.dataset.tema = "claro"; });
  window.addEventListener("afterprint", aplicar);
})();`;
