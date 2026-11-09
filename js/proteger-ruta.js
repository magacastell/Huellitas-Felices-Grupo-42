// Control de acceso del lado del cliente: comprueba formato, no la firma del JWT.
function protegerRuta() {
  const autorizado = haySesionValida();

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
