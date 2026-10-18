import {
  obtenerRegistros,
  guardarRegistros,
  generarId,
} from "./storage.js";

// clave para guardar los veterinarios en el localstorage
const CLAVE_VETERINARIOS = "veterinarios";

// guarda el id si se edita un veterinario
let idVeterinarioEditando = null;

// elementos del dom que trae del html
const formVeterinario = document.getElementById("formVeterinario");
const inputMatricula = document.getElementById("matricula");
const inputNombre = document.getElementById("nombre");
const inputEspecializacion = document.getElementById("especializacion");
const inputValorConsulta = document.getElementById("valorConsulta");
const btnGuardarVeterinario = document.getElementById("btnGuardarVeterinario");
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
function capturarYValidarDatos(veterinarios) {
  const matricula = Number.parseInt(inputMatricula.value.trim(), 10);
  const nombre = inputNombre.value.trim();
  const especializacion = inputEspecializacion.value.trim();
  const valorConsulta = Number.parseFloat(inputValorConsulta.value.trim());

  if (!Number.isInteger(matricula) || matricula < 1) {
    alert("Por favor, ingresá un número de matrícula válido (entero mayor a 0).");
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

  if (Number.isNaN(valorConsulta) || valorConsulta < 0) {
    alert("Por favor, ingresá un valor de consulta válido (mayor o igual a 0).");
    inputValorConsulta.focus();
    return null;
  }

  // se fija que no haya otro veterinario con la misma matrícula
  const matriculaDuplicada = veterinarios.some(
    (vet) => vet.matricula === matricula && vet.id !== idVeterinarioEditando
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
  const veterinarios = obtenerRegistros(CLAVE_VETERINARIOS);

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
    const contenedorBotones = document.createElement("div");
    contenedorBotones.className = "d-flex gap-2";

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.className = "btn btn-sm btn-outline-primary";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => cargarVeterinarioEnFormulario(vet.id));

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn btn-sm btn-outline-danger";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => eliminarVeterinario(vet.id));

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

// sube los datos del veterinario al editar
function cargarVeterinarioEnFormulario(id) {
  const veterinarios = obtenerRegistros(CLAVE_VETERINARIOS);
  const veterinario = veterinarios.find((vet) => vet.id === id);

  if (!veterinario) {
    return;
  }

  idVeterinarioEditando = veterinario.id;
  inputMatricula.value = veterinario.matricula;
  inputNombre.value = veterinario.nombre;
  inputEspecializacion.value = veterinario.especializacion;
  inputValorConsulta.value = veterinario.valorConsulta;

  btnGuardarVeterinario.textContent = "Actualizar veterinario";
  formVeterinario.scrollIntoView({ behavior: "smooth" });
  inputMatricula.focus();
}

// borra un veterinario
function eliminarVeterinario(id) {
  const veterinarios = obtenerRegistros(CLAVE_VETERINARIOS);
  const veterinario = veterinarios.find((vet) => vet.id === id);

  if (!veterinario) {
    return;
  }

  const confirmado = confirm(
    `¿Estás seguro de que deseás eliminar a "${veterinario.nombre}" (Matrícula: ${veterinario.matricula})?`
  );

  if (!confirmado) {
    return;
  }

  const nuevosRegistros = veterinarios.filter((vet) => vet.id !== id);
  guardarRegistros(CLAVE_VETERINARIOS, nuevosRegistros);

  // si justo borra el que se estaba editando, limpia el form
  if (idVeterinarioEditando === id) {
    formVeterinario.reset();
  }

  renderizarTabla();
}

// vuelve el botón y el form al modo normal
function salirModoEdicion() {
  idVeterinarioEditando = null;
  btnGuardarVeterinario.textContent = "Guardar veterinario";
}

// cuando se envía el formulario (guardar uno nuevo o editar)
formVeterinario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const veterinarios = obtenerRegistros(CLAVE_VETERINARIOS);
  const datosValidos = capturarYValidarDatos(veterinarios);

  if (!datosValidos) {
    return;
  }

  if (idVeterinarioEditando !== null) {
    // pide confirmación antes de guardar los cambios
    const confirmarEdicion = confirm(
      `¿Confirmás la actualización de los datos de "${datosValidos.nombre}"?`
    );

    if (!confirmarEdicion) {
      return;
    }

    const veterinariosActualizados = veterinarios.map((vet) =>
      vet.id === idVeterinarioEditando
        ? { id: idVeterinarioEditando, ...datosValidos }
        : vet
    );

    guardarRegistros(CLAVE_VETERINARIOS, veterinariosActualizados);
  } else {
    // si es uno nuevo le genera el id automático y lo guarda
    const nuevoVeterinario = {
      id: generarId(),
      ...datosValidos,
    };

    veterinarios.push(nuevoVeterinario);
    guardarRegistros(CLAVE_VETERINARIOS, veterinarios);
  }

  formVeterinario.reset();
  salirModoEdicion();
  renderizarTabla();
});

// si tocan el botón limpiar, sale del modo edición
formVeterinario.addEventListener("reset", () => {
  salirModoEdicion();
});

// apenas carga la página muestra la tabla
document.addEventListener("DOMContentLoaded", () => {
  renderizarTabla();
});
