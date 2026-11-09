/*
 * Funciones compartidas para gestionar LocalStorage.
 *
 * Cada entidad se almacena en una clave independiente.
 */

// Recupera los registros de una entidad.
const estados = new Map();
const textoValido = (valor) => typeof valor === "string" && valor.trim() !== "";
const identificador = (clave, registro) => {
  if (clave === "mascotas") return registro.idMascota;
  if (clave === "historiasClinicas") return registro.idHistoriaClinica;
  return registro.idVeterinario ?? registro.id;
};

function registroValido(clave, registro) {
  if (!registro || typeof registro !== "object" || Array.isArray(registro)) return false;
  if (!textoValido(identificador(clave, registro))) return false;
  if (clave === "mascotas") {
    return [registro.nombreMascota, registro.nombreDuenio, registro.color].every(textoValido)
      && Number.isSafeInteger(registro.edad) && registro.edad >= 0
      && Number.isFinite(registro.peso) && registro.peso >= 0;
  }
  if (clave === "historiasClinicas") {
    return [
      registro.idMascota,
      registro.idVeterinario,
      registro.fecha,
      registro.diagnostico,
      registro.tratamiento,
    ].every(textoValido);
  }
  return clave === "veterinarios"
    && Number.isSafeInteger(registro.matricula) && registro.matricula > 0
    && textoValido(registro.nombre) && textoValido(registro.especializacion)
    && Number.isFinite(registro.valorConsulta) && registro.valorConsulta >= 0;
}

// Solo filtra en memoria. Si hay datos inválidos, bloquea toda escritura.
export function obtenerRegistros(clave) {
  try {
    const original = localStorage.getItem(clave);
    const registros = original === null ? [] : JSON.parse(original);
    if (!Array.isArray(registros)) throw new Error("Se esperaba una lista.");
    const validos = registros.filter((registro) => registroValido(clave, registro));
    const bloqueado = validos.length !== registros.length;
    const anterior = estados.get(clave);
    estados.set(clave, { original, bloqueado });
    if (bloqueado && (!anterior || anterior.original !== original)) {
      alert(`Hay registros inválidos en ${clave}. Se muestran solo los válidos. Se bloquearon los cambios para conservar los datos originales hasta recuperarlos.`);
    }
    const ids = validos.map((registro) => identificador(clave, registro));
    if (new Set(ids).size !== ids.length && (!anterior || anterior.original !== original)) {
      alert(`Hay identificadores duplicados en ${clave}. No se pueden editar ni eliminar los registros ambiguos ni guardar listas con IDs repetidos. Los datos originales se conservan.`);
    }
    // Normaliza en memoria sin descartar el ID antiguo ni otros campos.
    return clave === "veterinarios"
      ? validos.map((registro) => ({ ...registro, idVeterinario: registro.idVeterinario ?? registro.id }))
      : validos;
  } catch (error) {
    const anterior = estados.get(clave);
    estados.set(clave, { bloqueado: true });
    console.error(`Error al leer ${clave}:`, error);
    if (!anterior || !anterior.bloqueado) {
      alert(`No se pudieron cargar los datos de ${clave}. No se guardarán cambios para evitar perder información. Revisá el almacenamiento y recargá la página.`);
    }
    return [];
  }
}

// Guarda todos los registros de una entidad.
export function guardarRegistros(clave, registros) {
  const estado = estados.get(clave);
  if (!estado || estado.bloqueado) {
    alert(`No se guardaron los cambios de ${clave}. Recuperá el almacenamiento y recargá la página antes de continuar.`);
    return false;
  }
  try {
    if (localStorage.getItem(clave) !== estado.original) {
      alert("Los datos guardados cambiaron. No se guardaron los cambios. Recargá la página antes de continuar.");
      return false;
    }
    if (!Array.isArray(registros) || !registros.every((registro) => registroValido(clave, registro))) {
      alert("No se guardaron los cambios porque contienen registros inválidos.");
      return false;
    }
    const ids = registros.map((registro) => identificador(clave, registro));
    if (new Set(ids).size !== ids.length) {
      alert("Hay identificadores duplicados. No se guardaron cambios para evitar operaciones ambiguas. Los identificadores originales se conservan.");
      return false;
    }
    const datosJSON = JSON.stringify(registros);
    localStorage.setItem(clave, datosJSON);
    estados.set(clave, { original: datosJSON, bloqueado: false });
    return true;
  } catch (error) {
    console.error(`Error al guardar ${clave}:`, error);
    alert("No se pudieron guardar los cambios. Revisá los permisos o el espacio del almacenamiento e intentá nuevamente. Los datos del formulario se conservan.");
    return false;
  }
}

export function buscarRegistroUnico(registros, campo, id) {
  const coincidencias = registros.filter((registro) => registro[campo] === id);
  if (!textoValido(id) || coincidencias.length !== 1) {
    alert("No se puede editar o eliminar: el identificador no existe o está duplicado. Los datos originales se conservan. Revisá los registros y recargá la página.");
    return null;
  }
  return coincidencias[0];
}

// Genera un identificador único para cada registro.
export function generarId() {
  return crypto.randomUUID();
}

// Lee los originales para no ignorar relaciones filtradas por otros módulos.
export function puedeEliminarEntidad(campo, id) {
  try {
    for (const clave of ["turnos", "historiasClinicas"]) {
      const original = localStorage.getItem(clave);
      const registros = original === null ? [] : JSON.parse(original);
      if (!Array.isArray(registros) || registros.some((registro) =>
        !registro || typeof registro !== "object" || !textoValido(registro[campo]))) {
        throw new Error("No se pudieron comprobar todas las relaciones.");
      }
      if (registros.some((registro) => registro[campo] === id)) {
        const entidad = campo === "idMascota" ? "la mascota" : "el veterinario";
        alert(`No se puede eliminar ${entidad}: tiene turnos o registros clínicos relacionados.`);
        return false;
      }
    }
    return true;
  } catch {
    alert("No se puede eliminar: no se pudieron verificar los turnos o las historias clínicas. Revisá el almacenamiento e intentá nuevamente. Los datos se conservan.");
    return false;
  }
}
