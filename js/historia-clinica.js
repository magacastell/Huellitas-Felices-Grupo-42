import {
  obtenerRegistros,
  guardarRegistros,
  generarId,
  buscarRegistroUnico,
} from "./storage.js";

const CLAVE_HISTORIAS = "historiasClinicas";
const CLAVE_MASCOTAS = "mascotas";
const CLAVE_VETERINARIOS = "veterinarios";

let historiasClinicas = obtenerRegistros(CLAVE_HISTORIAS);
let idMascotaConsultada = null;

const formHistoriaClinica = document.getElementById("formHistoriaClinica");
const selectMascota = document.getElementById("selectMascota");
const selectVeterinario = document.getElementById("selectVeterinario");
const inputFechaAtencion = document.getElementById("fechaAtencion");
const inputDiagnostico = document.getElementById("diagnostico");
const inputTratamiento = document.getElementById("tratamiento");

const formConsultaHistorial = document.getElementById("formConsultaHistorial");
const selectMascotaHistorial = document.getElementById("selectMascotaHistorial");
const contadorHistorialMascota = document.getElementById("contadorHistorialMascota");
const mensajeHistorialMascota = document.getElementById("mensajeHistorialMascota");
const contenedorHistorialMascota = document.getElementById("contenedorHistorialMascota");

const tablaHistoriasClinicas = document.getElementById("tablaHistoriasClinicas");
const contadorHistorias = document.getElementById("contadorHistorias");
const mensajeHistoriasClinicas = document.getElementById("mensajeHistoriasClinicas");

const elementoModalDetalle = document.getElementById("modalDetalleHistoria");
const modalDetalleHistoria = new bootstrap.Modal(elementoModalDetalle);
const detalleMascota = document.getElementById("detalleMascota");
const detalleFecha = document.getElementById("detalleFecha");
const detalleVeterinario = document.getElementById("detalleVeterinario");
const detalleDiagnostico = document.getElementById("detalleDiagnostico");
const detalleTratamiento = document.getElementById("detalleTratamiento");

function obtenerMascotas() {
  return obtenerRegistros(CLAVE_MASCOTAS);
}

function obtenerVeterinarios() {
  return obtenerRegistros(CLAVE_VETERINARIOS).map((veterinario) => ({
    ...veterinario,
    idVeterinario: veterinario.idVeterinario ?? veterinario.id,
  }));
}

function formatearFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

function poblarSelectMascotas(selectElement, textoPlaceholder, valorSeleccionado = "") {
  const mascotas = obtenerMascotas();
  selectElement.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.disabled = true;
  opcionInicial.defaultSelected = true;
  opcionInicial.selected = true;
  opcionInicial.textContent = mascotas.length === 0
    ? "No hay mascotas registradas"
    : textoPlaceholder;
  selectElement.appendChild(opcionInicial);

  mascotas.forEach((mascota) => {
    const opcion = document.createElement("option");
    opcion.value = mascota.idMascota;
    opcion.textContent = `${mascota.nombreMascota} (Dueño/a: ${mascota.nombreDuenio})`;
    if (mascota.idMascota === valorSeleccionado) {
      opcion.selected = true;
      opcionInicial.selected = false;
    }
    selectElement.appendChild(opcion);
  });
}

function poblarSelectVeterinarios(valorSeleccionado = "") {
  const veterinarios = obtenerVeterinarios();
  selectVeterinario.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.disabled = true;
  opcionInicial.defaultSelected = true;
  opcionInicial.selected = true;
  opcionInicial.textContent = veterinarios.length === 0
    ? "No hay veterinarios registrados"
    : "Seleccioná un veterinario";
  selectVeterinario.appendChild(opcionInicial);

  veterinarios.forEach((veterinario) => {
    const opcion = document.createElement("option");
    opcion.value = veterinario.idVeterinario;
    opcion.textContent = `${veterinario.nombre} - ${veterinario.especializacion} (Mat. ${veterinario.matricula})`;
    if (veterinario.idVeterinario === valorSeleccionado) {
      opcion.selected = true;
      opcionInicial.selected = false;
    }
    selectVeterinario.appendChild(opcion);
  });
}

function cargarSelectores() {
  poblarSelectMascotas(selectMascota, "Seleccioná una mascota", selectMascota.value);
  poblarSelectMascotas(
    selectMascotaHistorial,
    "Seleccioná una mascota para consultar su historial",
    idMascotaConsultada ?? selectMascotaHistorial.value
  );
  poblarSelectVeterinarios(selectVeterinario.value);
}

function obtenerNombreMascota(idMascota, mascotas) {
  const mascota = mascotas.find((item) => item.idMascota === idMascota);
  return mascota ? mascota.nombreMascota : "Mascota no disponible";
}

function obtenerNombreMascotaConDuenio(idMascota, mascotas) {
  const mascota = mascotas.find((item) => item.idMascota === idMascota);
  return mascota
    ? `${mascota.nombreMascota} (Dueño/a: ${mascota.nombreDuenio})`
    : "Mascota no disponible";
}

function obtenerNombreVeterinario(idVeterinario, veterinarios) {
  const veterinario = veterinarios.find((item) => item.idVeterinario === idVeterinario);
  return veterinario ? veterinario.nombre : "Veterinario no disponible";
}

function capturarYValidarHistoria() {
  const mascotas = obtenerMascotas();
  const veterinarios = obtenerVeterinarios();

  const idMascota = selectMascota.value.trim();
  const idVeterinario = selectVeterinario.value.trim();
  const fecha = inputFechaAtencion.value.trim();
  const diagnostico = inputDiagnostico.value.trim();
  const tratamiento = inputTratamiento.value.trim();

  if (!idMascota) {
    alert("Seleccioná una mascota para registrar la atención clínica.");
    selectMascota.focus();
    return null;
  }

  const mascotaExiste = mascotas.some((mascota) => mascota.idMascota === idMascota);
  if (!mascotaExiste) {
    alert("La mascota seleccionada no existe en los registros actuales. Recargá los datos e intentá nuevamente.");
    cargarSelectores();
    selectMascota.focus();
    return null;
  }

  if (!idVeterinario) {
    alert("Seleccioná un veterinario para registrar la atención clínica.");
    selectVeterinario.focus();
    return null;
  }

  const veterinarioExiste = veterinarios.some(
    (veterinario) => veterinario.idVeterinario === idVeterinario
  );
  if (!veterinarioExiste) {
    alert("El veterinario seleccionado no existe en los registros actuales. Recargá los datos e intentá nuevamente.");
    cargarSelectores();
    selectVeterinario.focus();
    return null;
  }

  if (!fecha) {
    alert("Ingresá una fecha de atención válida.");
    inputFechaAtencion.focus();
    return null;
  }

  if (!diagnostico || diagnostico.length > 500) {
    alert("Completá el diagnóstico con texto válido (máximo 500 caracteres).");
    inputDiagnostico.focus();
    return null;
  }

  if (!tratamiento || tratamiento.length > 1000) {
    alert("Completá el tratamiento con texto válido (máximo 1000 caracteres).");
    inputTratamiento.focus();
    return null;
  }

  return {
    idMascota,
    idVeterinario,
    fecha,
    diagnostico,
    tratamiento,
  };
}

function crearHistoriaClinica({ idMascota, idVeterinario, fecha, diagnostico, tratamiento }) {
  return {
    idHistoriaClinica: generarId(),
    idMascota,
    idVeterinario,
    fecha,
    diagnostico,
    tratamiento,
  };
}

function verDetalleHistoria(idHistoriaClinica) {
  const historia = buscarRegistroUnico(historiasClinicas, "idHistoriaClinica", idHistoriaClinica);
  if (!historia) return;

  const mascotas = obtenerMascotas();
  const veterinarios = obtenerVeterinarios();

  detalleMascota.textContent = obtenerNombreMascotaConDuenio(historia.idMascota, mascotas);
  detalleFecha.textContent = formatearFecha(historia.fecha);
  detalleVeterinario.textContent = obtenerNombreVeterinario(historia.idVeterinario, veterinarios);
  detalleDiagnostico.textContent = historia.diagnostico;
  detalleTratamiento.textContent = historia.tratamiento;

  modalDetalleHistoria.show();
}

function renderizarTablaGeneral() {
  const mascotas = obtenerMascotas();
  const veterinarios = obtenerVeterinarios();

  tablaHistoriasClinicas.replaceChildren();

  const cantidad = historiasClinicas.length;
  contadorHistorias.textContent = `${cantidad} ${cantidad === 1 ? "entrada" : "entradas"}`;

  mensajeHistoriasClinicas.textContent = cantidad === 0
    ? "No hay entradas clínicas registradas."
    : "";

  const historiasOrdenadas = [...historiasClinicas].sort((a, b) =>
    b.fecha.localeCompare(a.fecha)
  );

  historiasOrdenadas.forEach((historia) => {
    const fila = document.createElement("tr");

    const celdaMascota = document.createElement("td");
    celdaMascota.textContent = obtenerNombreMascota(historia.idMascota, mascotas);

    const celdaFecha = document.createElement("td");
    celdaFecha.textContent = formatearFecha(historia.fecha);

    const celdaVeterinario = document.createElement("td");
    celdaVeterinario.textContent = obtenerNombreVeterinario(historia.idVeterinario, veterinarios);

    const celdaDiagnostico = document.createElement("td");
    celdaDiagnostico.textContent = historia.diagnostico;

    const celdaAcciones = document.createElement("td");
    celdaAcciones.className = "admin-actions";

    const botonDetalle = document.createElement("button");
    botonDetalle.type = "button";
    botonDetalle.className = "btn btn-sm admin-btn-edit";
    botonDetalle.textContent = "Ver detalle";
    botonDetalle.addEventListener("click", () => {
      verDetalleHistoria(historia.idHistoriaClinica);
    });

    celdaAcciones.appendChild(botonDetalle);

    fila.appendChild(celdaMascota);
    fila.appendChild(celdaFecha);
    fila.appendChild(celdaVeterinario);
    fila.appendChild(celdaDiagnostico);
    fila.appendChild(celdaAcciones);

    tablaHistoriasClinicas.appendChild(fila);
  });
}

function renderizarHistorialMascota(idMascota) {
  const mascotas = obtenerMascotas();
  const veterinarios = obtenerVeterinarios();

  contenedorHistorialMascota.replaceChildren();

  if (!idMascota) {
    contadorHistorialMascota.textContent = "0 registros";
    mensajeHistorialMascota.textContent = "";
    return;
  }

  const mascota = mascotas.find((item) => item.idMascota === idMascota);
  if (!mascota) {
    contadorHistorialMascota.textContent = "No encontrada";
    mensajeHistorialMascota.textContent =
      "La mascota seleccionada ya no existe en los registros.";
    return;
  }

  const entradasMascota = historiasClinicas
    .filter((historia) => historia.idMascota === idMascota)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const cantidad = entradasMascota.length;
  contadorHistorialMascota.textContent = `${cantidad} ${cantidad === 1 ? "registro" : "registros"}`;

  if (cantidad === 0) {
    mensajeHistorialMascota.textContent =
      `La mascota "${mascota.nombreMascota}" (Dueño/a: ${mascota.nombreDuenio}) todavía no tiene atenciones clínicas registradas.`;
    return;
  }

  mensajeHistorialMascota.textContent =
    `Mostrando historial clínico completo de "${mascota.nombreMascota}" (Dueño/a: ${mascota.nombreDuenio}), ordenado por fecha:`;

  entradasMascota.forEach((entrada) => {
    const columna = document.createElement("div");
    columna.className = "col-12";

    const tarjeta = document.createElement("article");
    tarjeta.className = "card p-3 border";

    const encabezado = document.createElement("div");
    encabezado.className = "d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom";

    const etiquetaFecha = document.createElement("span");
    etiquetaFecha.className = "badge admin-counter";
    etiquetaFecha.textContent = `Fecha: ${formatearFecha(entrada.fecha)}`;

    const textoVeterinario = document.createElement("span");
    textoVeterinario.className = "fw-semibold text-dark";
    textoVeterinario.textContent = `Veterinario/a: ${obtenerNombreVeterinario(entrada.idVeterinario, veterinarios)}`;

    encabezado.appendChild(etiquetaFecha);
    encabezado.appendChild(textoVeterinario);

    const grillaDetalle = document.createElement("div");
    grillaDetalle.className = "row g-3";

    const colDiagnostico = document.createElement("div");
    colDiagnostico.className = "col-12 col-md-6";

    const tituloDiagnostico = document.createElement("h3");
    tituloDiagnostico.className = "h6 fw-bold texto-violeta mb-1";
    tituloDiagnostico.textContent = "Diagnóstico";

    const parrafoDiagnostico = document.createElement("p");
    parrafoDiagnostico.className = "mb-0 text-dark text-break";
    parrafoDiagnostico.style.whiteSpace = "pre-wrap";
    parrafoDiagnostico.textContent = entrada.diagnostico;

    colDiagnostico.appendChild(tituloDiagnostico);
    colDiagnostico.appendChild(parrafoDiagnostico);

    const colTratamiento = document.createElement("div");
    colTratamiento.className = "col-12 col-md-6";

    const tituloTratamiento = document.createElement("h3");
    tituloTratamiento.className = "h6 fw-bold texto-turquesa mb-1";
    tituloTratamiento.textContent = "Tratamiento";

    const parrafoTratamiento = document.createElement("p");
    parrafoTratamiento.className = "mb-0 text-dark text-break";
    parrafoTratamiento.style.whiteSpace = "pre-wrap";
    parrafoTratamiento.textContent = entrada.tratamiento;

    colTratamiento.appendChild(tituloTratamiento);
    colTratamiento.appendChild(parrafoTratamiento);

    grillaDetalle.appendChild(colDiagnostico);
    grillaDetalle.appendChild(colTratamiento);

    tarjeta.appendChild(encabezado);
    tarjeta.appendChild(grillaDetalle);
    columna.appendChild(tarjeta);
    contenedorHistorialMascota.appendChild(columna);
  });
}

formHistoriaClinica.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const datosValidos = capturarYValidarHistoria();
  if (!datosValidos) return;

  const nuevaHistoria = crearHistoriaClinica(datosValidos);
  const actualizadas = [...historiasClinicas, nuevaHistoria];

  if (!guardarRegistros(CLAVE_HISTORIAS, actualizadas)) return;

  historiasClinicas = actualizadas;
  formHistoriaClinica.reset();
  cargarSelectores();
  renderizarTablaGeneral();

  if (idMascotaConsultada === nuevaHistoria.idMascota) {
    renderizarHistorialMascota(idMascotaConsultada);
  }
});

formConsultaHistorial.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const idSeleccionado = selectMascotaHistorial.value.trim();
  if (!idSeleccionado) {
    alert("Seleccioná una mascota para consultar su historial clínico.");
    selectMascotaHistorial.focus();
    return;
  }
  idMascotaConsultada = idSeleccionado;
  renderizarHistorialMascota(idMascotaConsultada);
});

cargarSelectores();
renderizarTablaGeneral();
