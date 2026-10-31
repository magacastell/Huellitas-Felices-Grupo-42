// Control de acceso del lado del cliente: comprueba formato, no la firma del JWT.
function protegerRuta() {
  let autorizado = false;
  try {
    const token = sessionStorage.getItem("authToken");
    if (typeof token === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      const decodificar = (segmento) => {
        const base64 = segmento.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
      };
      const [cabecera, contenido] = token.split(".").slice(0, 2).map(decodificar);
      autorizado = Boolean(cabecera && typeof cabecera.alg === "string"
        && cabecera.alg !== "none" && contenido && typeof contenido === "object"
        && !Array.isArray(contenido));
    }
  } catch {
    autorizado = false;
  }

  if (!autorizado) {
    document.documentElement.style.visibility = "hidden";
    window.location.replace("./login.html");
  }
  return autorizado;
}

// Este script debe cargarse sin defer ni async en el head de la página protegida.
protegerRuta();
document.addEventListener("DOMContentLoaded", () => {
  if (protegerRuta()) document.documentElement.style.removeProperty("visibility");
});
window.addEventListener("pageshow", () => {
  if (protegerRuta()) document.documentElement.style.removeProperty("visibility");
});
// Evita restaurar una vista administrativa visible desde la caché de navegación.
window.addEventListener("pagehide", () => {
  document.documentElement.style.visibility = "hidden";
});
