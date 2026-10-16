import {
    obtenerRegistros,
    guardarRegistros,
    generarId
} from "./storage.js";

let mascotas = obtenerRegistros("mascotas");
let idMascotaEditando = null;

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
    mascotas.push(mascota);
    guardarRegistros("mascotas", mascotas);
}

function editarMascota(idMascota) {
    const mascota = mascotas.find(function (mascota) {
        return mascota.idMascota === idMascota;
    });

    document.getElementById("nombreMascota").value = mascota.nombreMascota;
    document.getElementById("nombreDuenio").value = mascota.nombreDuenio;
    document.getElementById("color").value = mascota.color;
    document.getElementById("peso").value = mascota.peso;
    document.getElementById("edad").value = mascota.edad;

    idMascotaEditando = mascota.idMascota;
}

function mostrarMascotas() {
    const tablaMascotas = document.getElementById("tablaMascotas");
    const contadorMascotas = document.getElementById("contadorMascotas");
    const mensajeMascotas = document.getElementById("mensajeMascotas");

    tablaMascotas.innerHTML = "";
    contadorMascotas.textContent = `${mascotas.length} mascotas`;

    mensajeMascotas.textContent = mascotas.length === 0
        ? "No hay mascotas registradas."
        : "";

    mascotas.forEach(function (mascota) {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${mascota.nombreMascota}</td>
            <td>${mascota.nombreDuenio}</td>
            <td>${mascota.color}</td>
            <td>${mascota.edad}</td>
            <td>${mascota.peso}</td>
            <td>
                <button type="button" class="btn btn-sm btn-warning btn-editar">
                    Editar
                </button>
                <button type="button" class="btn btn-sm btn-danger btn-eliminar">
                    Eliminar
                </button>
            </td>
        `;

        const botonEditar = fila.querySelector(".btn-editar");

        botonEditar.addEventListener("click", function () {
            editarMascota(mascota.idMascota);
        });

        const botonEliminar = fila.querySelector(".btn-eliminar");

        botonEliminar.addEventListener("click", function () {
            const confirmar = confirm(
                `¿Estás seguro de que querés eliminar a ${mascota.nombreMascota}?`
            );

            if (confirmar) {
                eliminarMascota(mascota.idMascota);
            }
        });

        tablaMascotas.appendChild(fila);
    });
}

const formularioMascota = document.getElementById("formularioMascota");

formularioMascota.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nombreMascota = document.getElementById("nombreMascota").value;
    const nombreDuenio = document.getElementById("nombreDuenio").value;
    const color = document.getElementById("color").value;
    const peso = Number(document.getElementById("peso").value);
    const edad = Number(document.getElementById("edad").value);

    if (idMascotaEditando === null) {
        const mascota = crearMascota(
            nombreMascota,
            nombreDuenio,
            color,
            peso,
            edad
        );
        registrarMascota(mascota);
    } else {
        mascotas = mascotas.map(function (mascota) {
            if (mascota.idMascota === idMascotaEditando) {
                mascota.nombreMascota = nombreMascota;
                mascota.nombreDuenio = nombreDuenio;
                mascota.color = color;
                mascota.peso = peso;
                mascota.edad = edad;
            }
            return mascota;
        });
        guardarRegistros("mascotas", mascotas);
        idMascotaEditando = null;
    }
    mostrarMascotas();
    formularioMascota.reset();
    console.log(mascotas);
});

function eliminarMascota(idMascota) {
    mascotas = mascotas.filter(function (mascota) {
        return mascota.idMascota !== idMascota;
    });

    guardarRegistros("mascotas", mascotas);
    mostrarMascotas();
}

mostrarMascotas();