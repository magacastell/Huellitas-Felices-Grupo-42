import {
  obtenerRegistros,
  guardarRegistros,
  generarId,
} from "./storage.js";

// clave para guardar los veterinarios en el localstorage
const CLAVE_VETERINARIOS = "veterinarios";

// Adapta registros anteriores en memoria, sin escribir ni descartar campos.
function obtenerVeterinarios() {
  return obtenerRegistros(CLAVE_VETERINARIOS).map((veterinario) => ({
    ...veterinario,
    idVeterinario: veterinario.idVeterinario ?? veterinario.id,
  }));
}

// guarda el id si se edita un veterinario
let idVeterinarioEditando = null;

// elementos del dom que trae del html
const formVeterinario = document.getElementById("formVeterinario");
const formEditarVeterinario = document.getElementById("formEditarVeterinario");
const elementoModalEditarVeterinario = document.getElementById("modalEditarVeterinario");
const modalEditarVeterinario = new bootstrap.Modal(elementoModalEditarVeterinario);
const tablaVeterinarios = document.getElementById("tablaVeterinarios");
const totalVeterinarios = document.getElementById("totalVeterinarios");

// para pasar el precio a formato pesos
const formateadorMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

// formato de moneda
function formatearMoneda(valor) {
  return formateadorMoneda.format(Number(valor) || 0);
}

// valida los datos del form
function capturarYValidarDatos(veterinarios, editando = false) {
  const inputMatricula = document.getElementById(editando ? "editarMatricula" : "matricula");
  const inputNombre = document.getElementById(editando ? "editarNombre" : "nombre");
  const inputEspecializacion = document.getElementById(editando ? "editarEspecializacion" : "especializacion");
  const inputValorConsulta = document.getElementById(editando ? "editarValorConsulta" : "valorConsulta");
  const matriculaIngresada = inputMatricula.value.trim();
  const matricula = Number(matriculaIngresada);
  const nombre = inputNombre.value.trim();
  const especializacion = inputEspecializacion.value.trim();
  const valorIngresado = inputValorConsulta.value.trim();
  const valorConsulta = Number(valorIngresado);

  if (!/^\d+$/.test(matriculaIngresada) || !Number.isSafeInteger(matricula) || matricula < 1) {
    alert("Por favor, ingresá una matrícula válida (entero positivo y seguro, escrito solo con dígitos).");
    inputMatricula.focus();
    return null;
  }

  if (nombre === "" || nombre.length > 100) {
    alert("Por favor, ingresá el nombre completo del veterinario.");
    inputNombre.focus();
    return null;
  }

  if (especializacion === "" || especializacion.length > 100) {
    alert("Por favor, ingresá la especialización del veterinario.");
    inputEspecializacion.focus();
    return null;
  }

  if (valorIngresado === "" || !Number.isFinite(valorConsulta) || valorConsulta < 0) {
    alert("Por favor, ingresá un valor de consulta válido (mayor o igual a 0).");
    inputValorConsulta.focus();
    return null;
  }

  // se fija que no haya otro veterinario con la misma matrícula
  const matriculaDuplicada = veterinarios.some(
    (vet) => vet.matricula === matricula && vet.idVeterinario !== (editando ? idVeterinarioEditando : null)
  );

  if (matriculaDuplicada) {
    alert(`Ya existe un veterinario registrado con la matrícula ${matricula}.`);
    inputMatricula.focus();
    return null;
  }

  return {
    matricula,
    nombre,
    especializacion,
    valorConsulta,
  };
}

// arma la tabla con los veterinarios guardados y actualiza el contador
function renderizarTabla() {
  const veterinarios = obtenerVeterinarios();

  // actualiza el contador
  const cantidad = veterinarios.length;
  totalVeterinarios.textContent = `${cantidad} ${
    cantidad === 1 ? "veterinario" : "veterinarios"
  }`;

  // vacía la tabla antes de volver a cargarla
  tablaVeterinarios.innerHTML = "";

  // si no hay ningún veterinario cargado muestra un cartel
  if (cantidad === 0) {
    const filaVacia = document.createElement("tr");
    const celdaVacia = document.createElement("td");
    celdaVacia.colSpan = 5;
    celdaVacia.className = "text-center text-muted py-4";
    celdaVacia.textContent = "No hay veterinarios registrados.";
    filaVacia.appendChild(celdaVacia);
    tablaVeterinarios.appendChild(filaVacia);
    return;
  }

  // arma una fila por cada veterinario
  veterinarios.forEach((vet) => {
    const fila = document.createElement("tr");

    const tdMatricula = document.createElement("td");
    tdMatricula.textContent = vet.matricula;

    const tdNombre = document.createElement("td");
    tdNombre.textContent = vet.nombre;

    const tdEspecializacion = document.createElement("td");
    tdEspecializacion.textContent = vet.especializacion;

    const tdValorConsulta = document.createElement("td");
    tdValorConsulta.textContent = formatearMoneda(vet.valorConsulta);

    const tdAcciones = document.createElement("td");
    tdAcciones.className = "admin-actions";
    const contenedorBotones = document.createElement("div");
    contenedorBotones.className = "admin-action-buttons";

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.className = "btn btn-sm admin-btn-edit";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => editarVeterinario(vet.idVeterinario));

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn btn-sm admin-btn-delete";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => eliminarVeterinario(vet.idVeterinario));

    contenedorBotones.appendChild(btnEditar);
    contenedorBotones.appendChild(btnEliminar);
    tdAcciones.appendChild(contenedorBotones);

    fila.appendChild(tdMatricula);
    fila.appendChild(tdNombre);
    fila.appendChild(tdEspecializacion);
    fila.appendChild(tdValorConsulta);
    fila.appendChild(tdAcciones);

    tablaVeterinarios.appendChild(fila);
  });
}

// Carga la edición en el modal, sin alterar el formulario de alta.
function editarVeterinario(idVeterinario) {
  const veterinarios = obtenerVeterinarios();
  const veterinario = veterinarios.find((vet) => vet.idVeterinario === idVeterinario);

  if (!veterinario) {
    return;
  }

  idVeterinarioEditando = veterinario.idVeterinario;
  document.getElementById("editarMatricula").value = veterinario.matricula;
  document.getElementById("editarNombre").value = veterinario.nombre;
  document.getElementById("editarEspecializacion").value = veterinario.especializacion;
  document.getElementById("editarValorConsulta").value = veterinario.valorConsulta;
  modalEditarVeterinario.show();
}

// borra un veterinario
function eliminarVeterinario(idVeterinario) {
  const veterinarios = obtenerVeterinarios();
  const veterinario = veterinarios.find((vet) => vet.idVeterinario === idVeterinario);

  if (!veterinario) {
    return;
  }

  const confirmado = confirm(
    `¿Estás seguro de que deseás eliminar a "${veterinario.nombre}" (Matrícula: ${veterinario.matricula})?`
  );

  if (!confirmado) {
    return;
  }

  const nuevosRegistros = veterinarios.filter((vet) => vet.idVeterinario !== idVeterinario);
  guardarRegistros(CLAVE_VETERINARIOS, nuevosRegistros);

  // si justo borra el que se estaba editando, limpia el form
  if (idVeterinarioEditando === idVeterinario) {
    modalEditarVeterinario.hide();
  }

  renderizarTabla();
}

// El formulario superior siempre registra un veterinario nuevo.
formVeterinario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const veterinarios = obtenerVeterinarios();
  const datosValidos = capturarYValidarDatos(veterinarios);
  if (!datosValidos) return;
  veterinarios.push({ idVeterinario: generarId(), ...datosValidos });
  guardarRegistros(CLAVE_VETERINARIOS, veterinarios);
  formVeterinario.reset();
  renderizarTabla();
});

formEditarVeterinario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const veterinarios = obtenerVeterinarios();
  if (!veterinarios.some((vet) => vet.idVeterinario === idVeterinarioEditando)) return;
  const datosValidos = capturarYValidarDatos(veterinarios, true);
  if (!datosValidos) return;
  if (!confirm(`¿Confirmás la actualización de los datos de "${datosValidos.nombre}"?`)) return;
  const actualizados = veterinarios.map((vet) =>
    vet.idVeterinario === idVeterinarioEditando ? { ...vet, ...datosValidos } : vet
  );
  guardarRegistros(CLAVE_VETERINARIOS, actualizados);
  renderizarTabla();
  modalEditarVeterinario.hide();
});

elementoModalEditarVeterinario.addEventListener("hidden.bs.modal", () => {
  idVeterinarioEditando = null;
  formEditarVeterinario.reset();
});

// apenas carga la página muestra la tabla
document.addEventListener("DOMContentLoaded", () => {
  renderizarTabla();
});
