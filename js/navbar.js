// Navegación compartida. La visibilidad del menú no protege el acceso por URL.
// Para incorporar otra página, usar los mismos atributos data-nav-* y cargar este módulo.
function haySesion() {
  try {
    return Boolean(sessionStorage.getItem("authToken"));
  } catch {
    return false;
  }
}

function actualizarNavegacion() {
  const sesionIniciada = haySesion();
  document.querySelectorAll("[data-nav-sesion]").forEach((elemento) => {
    elemento.classList.toggle("d-none", !sesionIniciada);
  });
  document.querySelectorAll("[data-nav-publico]").forEach((elemento) => {
    elemento.classList.toggle("d-none", sesionIniciada);
  });
}

function cerrarSesion() {
  try {
    sessionStorage.removeItem("authToken");
  } catch {
    alert("No se pudo cerrar la sesión. Revisá los permisos de almacenamiento e intentá nuevamente.");
    return;
  }
  actualizarNavegacion();
  window.location.assign("./index.html");
}

document.querySelectorAll("[data-cerrar-sesion]").forEach((boton) => {
  boton.addEventListener("click", cerrarSesion);
});

actualizarNavegacion();
// Revisa la sesión también al volver a una página restaurada por el navegador.
window.addEventListener("pageshow", actualizarNavegacion);
window.addEventListener("storage", actualizarNavegacion);
