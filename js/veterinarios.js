import {
  obtenerRegistros,
  guardarRegistros,
  generarId,
  buscarRegistroUnico,
  puedeEliminarEntidad,
} from "./storage.js";

const CLAVE_VETERINARIOS = "veterinarios";

function obtenerVeterinarios() {
  return obtenerRegistros(CLAVE_VETERINARIOS).map((veterinario) => ({
    ...veterinario,
    idVeterinario: veterinario.idVeterinario ?? veterinario.id,
  }));
}

let idVeterinarioEditando = null;

const formVeterinario = document.getElementById("formVeterinario");
const formEditarVeterinario = document.getElementById("formEditarVeterinario");
const elementoModalEditarVeterinario = document.getElementById("modalEditarVeterinario");
const modalEditarVeterinario = new bootstrap.Modal(elementoModalEditarVeterinario);
const tablaVeterinarios = document.getElementById("tablaVeterinarios");
const totalVeterinarios = document.getElementById("totalVeterinarios");

const elementoModalEliminarVeterinario = document.getElementById("modalEliminarVeterinario");
const modalEliminarVeterinario = new bootstrap.Modal(elementoModalEliminarVeterinario);
const mensajeEliminarVeterinario = document.getElementById("mensajeEliminarVeterinario");
const botonConfirmarEliminarVeterinario = document.getElementById("btnConfirmarEliminarVeterinario");
let idVeterinarioEliminar = null;
let botonOrigenEliminar = null;

function solicitarEliminacionVeterinario(idVeterinario, boton) {
  const veterinario = buscarRegistroUnico(obtenerVeterinarios(), "idVeterinario", idVeterinario);
  if (!veterinario) return;
  idVeterinarioEliminar = idVeterinario;
  botonOrigenEliminar = boton;
  mensajeEliminarVeterinario.textContent = `¿Estás seguro de que querés eliminar a "${veterinario.nombre}" (Matrícula: ${veterinario.matricula})?`;
  botonConfirmarEliminarVeterinario.disabled = false;
  modalEliminarVeterinario.show();
}

botonConfirmarEliminarVeterinario.addEventListener("click", () => {
  if (idVeterinarioEliminar === null || botonConfirmarEliminarVeterinario.disabled) return;
  if (eliminarVeterinario(idVeterinarioEliminar)) {
    botonConfirmarEliminarVeterinario.disabled = true;
    modalEliminarVeterinario.hide();
  }
});

elementoModalEliminarVeterinario.addEventListener("shown.bs.modal", () => {
  document.getElementById("btnCancelarEliminarVeterinario").focus();
});
elementoModalEliminarVeterinario.addEventListener("hidden.bs.modal", () => {
  idVeterinarioEliminar = null;
  const destino = botonOrigenEliminar?.isConnected
    ? botonOrigenEliminar : document.getElementById("nombre");
  botonOrigenEliminar = null;
  destino.focus();
});

const formateadorMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

function formatearMoneda(valor) {
  return formateadorMoneda.format(Number(valor) || 0);
}

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

function renderizarTabla() {
  const veterinarios = obtenerVeterinarios();

  // actualiza el contador
  const cantidad = veterinarios.length;
  totalVeterinarios.textContent = `${cantidad} ${
    cantidad === 1 ? "veterinario" : "veterinarios"
  }`;

  tablaVeterinarios.innerHTML = "";

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
    btnEliminar.addEventListener("click", () => solicitarEliminacionVeterinario(vet.idVeterinario, btnEliminar));

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

function editarVeterinario(idVeterinario) {
  const veterinarios = obtenerVeterinarios();
  const veterinario = buscarRegistroUnico(veterinarios, "idVeterinario", idVeterinario);

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

function eliminarVeterinario(idVeterinario) {
  const veterinarios = obtenerVeterinarios();
  const veterinario = buscarRegistroUnico(veterinarios, "idVeterinario", idVeterinario);

  if (!veterinario) {
    return;
  }

  if (!puedeEliminarEntidad("idVeterinario", idVeterinario)) return;
  const nuevosRegistros = veterinarios.filter((vet) => vet.idVeterinario !== idVeterinario);
  if (!guardarRegistros(CLAVE_VETERINARIOS, nuevosRegistros)) return;

  if (idVeterinarioEditando === idVeterinario) {
    modalEditarVeterinario.hide();
  }

  renderizarTabla();
  return true;
}

formVeterinario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const veterinarios = obtenerVeterinarios();
  const datosValidos = capturarYValidarDatos(veterinarios);
  if (!datosValidos) return;
  veterinarios.push({ idVeterinario: generarId(), ...datosValidos });
  if (!guardarRegistros(CLAVE_VETERINARIOS, veterinarios)) return;
  formVeterinario.reset();
  renderizarTabla();
});

formEditarVeterinario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const veterinarios = obtenerVeterinarios();
  if (!buscarRegistroUnico(veterinarios, "idVeterinario", idVeterinarioEditando)) return;
  const datosValidos = capturarYValidarDatos(veterinarios, true);
  if (!datosValidos) return;
  if (!confirm(`¿Confirmás la actualización de los datos de "${datosValidos.nombre}"?`)) return;
  const actualizados = veterinarios.map((vet) =>
    vet.idVeterinario === idVeterinarioEditando ? { ...vet, ...datosValidos } : vet
  );
  if (!guardarRegistros(CLAVE_VETERINARIOS, actualizados)) return;
  renderizarTabla();
  modalEditarVeterinario.hide();
});

elementoModalEditarVeterinario.addEventListener("hidden.bs.modal", () => {
  idVeterinarioEditando = null;
  formEditarVeterinario.reset();
});

document.addEventListener("DOMContentLoaded", () => {
  renderizarTabla();
});
