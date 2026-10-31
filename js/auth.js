const formularioLogin = document.getElementById("formularioLogin");
const inputUsuario = document.getElementById("usuario");
const inputContrasena = document.getElementById("contrasena");
const botonLogin = document.getElementById("botonLogin");
const errorLogin = document.getElementById("errorLogin");
let procesando = false;

function mostrarError(mensaje) {
  errorLogin.textContent = mensaje;
  errorLogin.hidden = false;
}

formularioLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (procesando) return;

  errorLogin.hidden = true;
  errorLogin.textContent = "";
  const username = inputUsuario.value.trim();
  // La contraseña se envía sin modificar sus caracteres.
  const password = inputContrasena.value;

  if (!username || !password.trim()) {
    mostrarError("Completá el nombre de usuario y la contraseña.");
    (!username ? inputUsuario : inputContrasena).focus();
    return;
  }

  procesando = true;
  botonLogin.disabled = true;
  botonLogin.textContent = "Iniciando sesión…";
  formularioLogin.setAttribute("aria-busy", "true");

  try {
    let respuesta;
    try {
      respuesta = await fetch("https://dummyjson.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      mostrarError("No se pudo conectar con el servicio. Revisá tu conexión e intentá nuevamente.");
      return;
    }

    if (!respuesta.ok) {
      mostrarError(respuesta.status === 400 || respuesta.status === 401
        ? "Usuario o contraseña incorrectos. Intentá nuevamente."
        : "El servicio no pudo iniciar sesión. Intentá nuevamente más tarde.");
      return;
    }

    const datos = await respuesta.json();
    if (typeof datos.accessToken !== "string" || !datos.accessToken.trim()) {
      mostrarError("El servicio no devolvió un token válido. Intentá nuevamente.");
      return;
    }

    try {
      sessionStorage.setItem("authToken", datos.accessToken);
    } catch {
      mostrarError("No se pudo guardar la sesión. Revisá los permisos de almacenamiento del navegador.");
      return;
    }

    formularioLogin.reset();
    window.location.assign("./index.html");
  } catch {
    mostrarError("No se pudo procesar la respuesta del servicio. Intentá nuevamente.");
  } finally {
    procesando = false;
    botonLogin.disabled = false;
    botonLogin.textContent = "Iniciar sesión";
    formularioLogin.removeAttribute("aria-busy");
  }
});
