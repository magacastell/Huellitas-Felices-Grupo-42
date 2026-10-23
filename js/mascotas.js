import {
  obtenerRegistros,
  guardarRegistros,
  generarId,
  buscarRegistroUnico
} from "./storage.js";

let mascotas = obtenerRegistros("mascotas");
let idMascotaEditando = null;

const formularioMascota = document.getElementById("formularioMascota");
const formularioEditarMascota = document.getElementById("formularioEditarMascota");

const elementoModalEditar = document.getElementById("modalEditarMascota");
const modalEditarMascota = new bootstrap.Modal(elementoModalEditar);

// Comparte las mismas validaciones entre alta y edición.
function capturarYValidarMascota(editando = false) {
  const campos = editando
    ? ["editarNombreMascota", "editarNombreDuenio", "editarColor", "editarPeso", "editarEdad"]
    : ["nombreMascota", "nombreDuenio", "color", "peso", "edad"];
  const inputs = campos.map((id) => document.getElementById(id));
  const [nombreMascota, nombreDuenio, color, pesoIngresado, edadIngresada] =
    inputs.map((input) => input.value.trim());

  for (let indice = 0; indice < 3; indice++) {
    if (inputs[indice].value.trim() === "") {
      alert("Completá los campos obligatorios con texto, no solo espacios.");
      inputs[indice].focus();
      return null;
    }
  }

  const edad = Number(edadIngresada);
  if (edadIngresada === "" || !Number.isSafeInteger(edad) || edad < 0) {
    alert("Ingresá una edad válida: un entero no negativo y seguro.");
    inputs[4].focus();
    return null;
  }

  const peso = Number(pesoIngresado);
  if (pesoIngresado === "" || !Number.isFinite(peso) || peso < 0) {
    alert("Ingresá un peso válido: un número finito mayor o igual a cero.");
    inputs[3].focus();
    return null;
  }

  return { nombreMascota, nombreDuenio, color, peso, edad };
}

function crearMascota(nombreMascota, nombreDuenio, color, peso, edad) {
  let mascota = {
    idMascota: generarId(),
    nombreMascota: nombreMascota,
    nombreDuenio: nombreDuenio,
    color: color,
    peso: peso,
    edad: edad
  };
  return mascota;
}

function registrarMascota(mascota) {
  const actualizadas = [...mascotas, mascota];
  if (!guardarRegistros("mascotas", actualizadas)) return false;
  mascotas = actualizadas;
  return true;
}

function editarMascota(idMascota) {
  const mascota = buscarRegistroUnico(mascotas, "idMascota", idMascota);
  if (!mascota) return;

  document.getElementById("editarNombreMascota").value = mascota.nombreMascota;
  document.getElementById("editarNombreDuenio").value = mascota.nombreDuenio;
  document.getElementById("editarColor").value = mascota.color;
  document.getElementById("editarPeso").value = mascota.peso;
  document.getElementById("editarEdad").value = mascota.edad;
  idMascotaEditando = mascota.idMascota;
  modalEditarMascota.show();
}

function mostrarMascotas() {
  const tablaMascotas = document.getElementById("tablaMascotas");
  const contadorMascotas = document.getElementById("contadorMascotas");
  const mensajeMascotas = document.getElementById("mensajeMascotas");

  tablaMascotas.replaceChildren();
  contadorMascotas.textContent = `${mascotas.length} mascotas`;

  mensajeMascotas.textContent = mascotas.length === 0
    ? "No hay mascotas registradas."
    : "";

  mascotas.forEach(function (mascota) {
    const fila = document.createElement("tr");
    [mascota.nombreMascota, mascota.nombreDuenio, mascota.color, mascota.edad, mascota.peso]
      .forEach(function (valor) {
        const celda = document.createElement("td");
        celda.textContent = valor;
        fila.appendChild(celda);
      });
    const acciones = document.createElement("td");
    acciones.className = "admin-actions";
    const botonEditar = document.createElement("button");
    botonEditar.type = "button";
    botonEditar.className = "btn btn-sm admin-btn-edit btn-editar";
    botonEditar.textContent = "Editar";
    botonEditar.addEventListener("click", function () {
      editarMascota(mascota.idMascota);
    });
    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.className = "btn btn-sm admin-btn-delete btn-eliminar";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.addEventListener("click", function () {
      const confirmar = confirm(
        `¿Estás seguro de que querés eliminar a ${mascota.nombreMascota}?`
      );

      if (confirmar) {
        eliminarMascota(mascota.idMascota);
      }
    });
    acciones.appendChild(botonEditar);
    acciones.appendChild(document.createTextNode(" "));
    acciones.appendChild(botonEliminar);
    fila.appendChild(acciones);
    tablaMascotas.appendChild(fila);
  });
}

formularioMascota.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const datos = capturarYValidarMascota();
  if (!datos) {
    return;
  }
  const { nombreMascota, nombreDuenio, color, peso, edad } = datos;
  const mascota = crearMascota(
    nombreMascota,
    nombreDuenio,
    color,
    peso,
    edad
  );

  if (!registrarMascota(mascota)) return;
  mostrarMascotas();
  formularioMascota.reset();
  console.log(mascotas);
});

formularioEditarMascota.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const datos = capturarYValidarMascota(true);
  if (!datos) {
    return;
  }

  const confirmar = confirm(
    "¿Estás seguro de que querés guardar los cambios de esta mascota?"
  );
  if (!confirmar) {
    return;
  }
  if (!buscarRegistroUnico(mascotas, "idMascota", idMascotaEditando)) return;
  const actualizadas = mascotas.map((mascota) =>
    mascota.idMascota === idMascotaEditando ? { ...mascota, ...datos } : mascota
  );
  if (!guardarRegistros("mascotas", actualizadas)) return;
  mascotas = actualizadas;
  idMascotaEditando = null;
  mostrarMascotas();
  formularioEditarMascota.reset();
  modalEditarMascota.hide();
  console.log(mascotas);
});

elementoModalEditar.addEventListener("hidden.bs.modal", function () {
  idMascotaEditando = null;
  formularioEditarMascota.reset();
});

function eliminarMascota(idMascota) {
  if (!buscarRegistroUnico(mascotas, "idMascota", idMascota)) return;
  const actualizadas = mascotas.filter(function (mascota) {
    return mascota.idMascota !== idMascota;
  });

  if (!guardarRegistros("mascotas", actualizadas)) return;
  mascotas = actualizadas;
  mostrarMascotas();
}
mostrarMascotas();
