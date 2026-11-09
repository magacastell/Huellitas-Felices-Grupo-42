import { obtenerRegistros, generarId } from "./storage.js";

let mascotas = obtenerRegistros("mascotas");
let veterinarios = obtenerRegistros("veterinarios");
let turnos = [];
let almacenamientoBloqueado = false;
let almacenamientoOriginal = null;
let idTurnoEliminar = null;

function obtenerTurnos() {
    try {
        const datosGuardados = localStorage.getItem("turnos");

        if (datosGuardados === null) {
            almacenamientoOriginal = null;
            return [];
        }
        const registros = JSON.parse(datosGuardados);

        if (!Array.isArray(registros)) {
            throw new Error("El almacenamiento de turnos no contiene una lista.");
        }
        const registrosValidos = registros.every(function (turno) {
            return turno &&
                typeof turno === "object" &&
                typeof turno.idTurno === "string" &&
                turno.idTurno.trim() !== "" &&
                typeof turno.idMascota === "string" &&
                typeof turno.idVeterinario === "string" &&
                typeof turno.fecha === "string" &&
                typeof turno.hora === "string" &&
                typeof turno.motivo === "string";
        });
        const ids = registros.map(function (turno) {
            return turno.idTurno;
        });

        if (!registrosValidos || new Set(ids).size !== ids.length) {
            throw new Error("Hay turnos inválidos o identificadores duplicados.");
        }

        almacenamientoOriginal = datosGuardados;
        return registros;
    } catch (error) {
        console.error("Error al recuperar los turnos:", error);
        almacenamientoBloqueado = true;
        mostrarMensaje("No se pudieron recuperar los turnos. No se realizarán cambios para proteger los datos existentes.", "danger");
        return [];
    }
}

const formularioTurno = document.getElementById("formTurno");
const selectorMascota = document.getElementById("turnoMascota");
const selectorVeterinario = document.getElementById("turnoVeterinario");
const campoFecha = document.getElementById("turnoFecha");
const campoHora = document.getElementById("turnoHora");
const campoMotivo = document.getElementById("turnoMotivo");
const mensajeTurnos = document.getElementById("mensajeTurnos");
const contadorTurnos = document.getElementById("contadorTurnos");
const cuerpoTablaTurnos = document.getElementById("cuerpoTablaTurnos");
const mensajeSinTurnos = document.getElementById("mensajeSinTurnos");
const elementoModalEliminar = document.getElementById("modalEliminarTurno");
const botonConfirmarEliminar = document.getElementById("btnConfirmarEliminarTurno");
const modalEliminar = bootstrap.Modal.getOrCreateInstance(elementoModalEliminar);

function mostrarMensaje(mensaje, tipo) {
    mensajeTurnos.textContent = mensaje;
    mensajeTurnos.className = `alert alert-${tipo} mb-3`;
}

function cargarMascotas() {
    selectorMascota.innerHTML = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccionar mascota";
    opcionInicial.disabled = true;
    opcionInicial.selected = true;

    selectorMascota.appendChild(opcionInicial);

    mascotas.forEach(function (mascota) {
        const opcion = document.createElement("option");
        opcion.value = mascota.idMascota;
        opcion.textContent = mascota.nombreMascota;
        selectorMascota.appendChild(opcion);
    });

    selectorMascota.disabled = mascotas.length === 0;
}

function cargarVeterinarios() {
    selectorVeterinario.innerHTML = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccionar veterinario";
    opcionInicial.disabled = true;
    opcionInicial.selected = true;

    selectorVeterinario.appendChild(opcionInicial);

    veterinarios.forEach(function (veterinario) {
        const opcion = document.createElement("option");
        opcion.value = veterinario.idVeterinario;
        opcion.textContent = veterinario.nombre;
        selectorVeterinario.appendChild(opcion);
    });

    selectorVeterinario.disabled = veterinarios.length === 0;
}

function verificarEntidades() {
    if (mascotas.length === 0 && veterinarios.length === 0) {
        mostrarMensaje("No hay mascotas ni veterinarios registrados. Primero debés registrar ambas entidades.", "warning");
    } else if (mascotas.length === 0) {
        mostrarMensaje("No hay mascotas registradas. Primero debés registrar una mascota.", "warning");
    } else if (veterinarios.length === 0) {
        mostrarMensaje("No hay veterinarios registrados. Primero debés registrar un veterinario.", "warning");
    }
}

function fechaValida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const partes = fecha.split("-").map(Number);
    const fechaIngresada = new Date(partes[0], partes[1] - 1, partes[2]);

    return fechaIngresada.getFullYear() === partes[0] &&
        fechaIngresada.getMonth() === partes[1] - 1 &&
        fechaIngresada.getDate() === partes[2];
}

function horaValida(hora) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

function validarTurno(idMascota, idVeterinario, fecha, hora, motivo) {
    if (!idMascota || !idVeterinario || !fecha || !hora || !motivo.trim()) {
        mostrarMensaje("Todos los campos son obligatorios.", "danger");
        return false;
    }

    const mascotaExiste = mascotas.some(function (mascota) {
        return mascota.idMascota === idMascota;
    });

    if (!mascotaExiste) {
        mostrarMensaje("La mascota seleccionada no existe. Actualizá la página e intentá nuevamente.", "danger");
        return false;
    }

    const veterinarioExiste = veterinarios.some(function (veterinario) {
        return veterinario.idVeterinario === idVeterinario;
    });

    if (!veterinarioExiste) {
        mostrarMensaje("El veterinario seleccionado no existe. Actualizá la página e intentá nuevamente.", "danger");
        return false;
    }

    if (!fechaValida(fecha)) {
        mostrarMensaje("La fecha ingresada no es válida.", "danger");
        return false;
    }

    if (!horaValida(hora)) {
        mostrarMensaje("La hora ingresada no es válida.", "danger");
        return false;
    }

    return true;
}

function guardarTurnos(nuevosTurnos) {
    if (almacenamientoBloqueado) {
        mostrarMensaje("No se pueden guardar cambios porque el almacenamiento está bloqueado. Revisá los datos y recargá la página.", "danger");
        return false;
    }

    try {
        const datosActuales = localStorage.getItem("turnos");

        if (datosActuales !== almacenamientoOriginal) {
            mostrarMensaje("Los datos de turnos cambiaron desde que abriste la página. Recargá para evitar sobrescribir información.", "danger");
            return false;
        }

        const ids = nuevosTurnos.map(function (turno) {
            return turno.idTurno;
        });

        if (new Set(ids).size !== ids.length) {
            mostrarMensaje("Hay identificadores de turnos duplicados. No se guardaron los cambios.", "danger");
            return false;
        }

        const datosJSON = JSON.stringify(nuevosTurnos);
        localStorage.setItem("turnos", datosJSON);
        almacenamientoOriginal = datosJSON;
        turnos = nuevosTurnos;

        return true;
    } catch (error) {
        console.error("Error al guardar los turnos:", error);
        mostrarMensaje("No se pudieron guardar los turnos. Revisá el almacenamiento e intentá nuevamente.", "danger");
        return false;
    }
}

function registrarTurno(evento) {
    evento.preventDefault();
    if (!protegerRuta()) return;

    // Revalidar entidades por si cambiaron desde otra pestaña.
    mascotas = obtenerRegistros("mascotas");
    veterinarios = obtenerRegistros("veterinarios");

    const idMascota = selectorMascota.value;
    const idVeterinario = selectorVeterinario.value;
    const fecha = campoFecha.value;
    const hora = campoHora.value;
    const motivo = campoMotivo.value.trim();

    if (!validarTurno(idMascota, idVeterinario, fecha, hora, motivo)) {
        return;
    }

    const nuevoTurno = {
        idTurno: generarId(),
        idMascota: idMascota,
        idVeterinario: idVeterinario,
        fecha: fecha,
        hora: hora,
        motivo: motivo
    };

    const nuevosTurnos = [...turnos, nuevoTurno];

    if (guardarTurnos(nuevosTurnos)) {
        mostrarTurnos();
        formularioTurno.reset();
        mostrarMensaje("¡El turno se registró correctamente!", "success");
    }
}

function mostrarTurnos() {
    cuerpoTablaTurnos.innerHTML = "";
    contadorTurnos.textContent = turnos.length;
    mensajeSinTurnos.classList.toggle("d-none", turnos.length > 0);

    turnos.forEach(function (turno) {
        const mascota = mascotas.find(function (mascota) {
            return mascota.idMascota === turno.idMascota;
        });

        const veterinario = veterinarios.find(function (veterinario) {
            return veterinario.idVeterinario === turno.idVeterinario;
        });

        const fila = document.createElement("tr");

        const celdaMascota = document.createElement("td");
        celdaMascota.textContent = mascota ? mascota.nombreMascota : "Mascota no disponible";

        const celdaVeterinario = document.createElement("td");
        celdaVeterinario.textContent = veterinario ? veterinario.nombre : "Veterinario no disponible";

        const celdaFecha = document.createElement("td");
        const partesFecha = turno.fecha.split("-");
        celdaFecha.textContent = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`;

        const celdaHora = document.createElement("td");
        celdaHora.textContent = turno.hora;

        const celdaMotivo = document.createElement("td");
        celdaMotivo.textContent = turno.motivo;

        const celdaAcciones = document.createElement("td");
        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "btn btn-sm btn-danger";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", function () {
            solicitarEliminacion(turno.idTurno);
        });

        celdaAcciones.appendChild(botonEliminar);

        fila.appendChild(celdaMascota);
        fila.appendChild(celdaVeterinario);
        fila.appendChild(celdaFecha);
        fila.appendChild(celdaHora);
        fila.appendChild(celdaMotivo);
        fila.appendChild(celdaAcciones);

        cuerpoTablaTurnos.appendChild(fila);
    });
}

function solicitarEliminacion(idTurno) {
    idTurnoEliminar = idTurno;
    modalEliminar.show();
}

function eliminarTurno() {
    if (!protegerRuta()) return;
    if (idTurnoEliminar === null) {
        return;
    }

    const turnoExiste = turnos.some(function (turno) {
        return turno.idTurno === idTurnoEliminar;
    });

    if (!turnoExiste) {
        mostrarMensaje("No se encontró el turno que intentás eliminar.", "danger");
        return;
    }

    const nuevosTurnos = turnos.filter(function (turno) {
        return turno.idTurno !== idTurnoEliminar;
    });

    if (guardarTurnos(nuevosTurnos)) {
        mostrarTurnos();
        mostrarMensaje("El turno se eliminó correctamente.", "success");
        modalEliminar.hide();
    }

    idTurnoEliminar = null;
}

formularioTurno.addEventListener("submit", registrarTurno);
botonConfirmarEliminar.addEventListener("click", eliminarTurno);

elementoModalEliminar.addEventListener("hidden.bs.modal", function () {
    idTurnoEliminar = null;
});

turnos = obtenerTurnos();

cargarMascotas();
cargarVeterinarios();
verificarEntidades();
mostrarTurnos();
