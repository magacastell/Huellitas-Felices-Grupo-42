// Comprobación local compartida: valida formato y vencimiento, no la firma del JWT.
function haySesionValida() {
  try {
    const token = sessionStorage.getItem("authToken");
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return false;
    const decodificar = (segmento) => {
      const base64 = segmento.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    };
    const [cabecera, contenido] = token.split(".").slice(0, 2).map(decodificar);
    return Boolean(cabecera && typeof cabecera === "object" && !Array.isArray(cabecera)
      && typeof cabecera.alg === "string" && cabecera.alg.trim() !== ""
      && cabecera.alg.toLowerCase() !== "none"
      && contenido && typeof contenido === "object" && !Array.isArray(contenido)
      && Number.isFinite(contenido.exp) && contenido.exp > Date.now() / 1000);
  } catch {
    return false;
  }
}
