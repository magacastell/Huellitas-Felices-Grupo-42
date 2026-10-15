
/*
 * Funciones compartidas para gestionar LocalStorage.
 *
 * Cada entidad se almacena en una clave independiente.
 */

// Recupera los registros de una entidad.
export function obtenerRegistros(clave) {
  const datosGuardados = localStorage.getItem(clave);

  // Si todavía no hay registros, devolvemos un array vacío.
  if (datosGuardados === null) {
    return [];
  }

  try {
    const registros = JSON.parse(datosGuardados);

    // Verificamos que los datos sean un array.
    return Array.isArray(registros) ? registros : [];
  } catch (error) {
    console.error(
      `Error al recuperar los registros de ${clave}:`,
      error
    );

    return [];
  }
}

// Guarda todos los registros de una entidad.
export function guardarRegistros(clave, registros) {
  const datosJSON = JSON.stringify(registros);
  localStorage.setItem(clave, datosJSON);
}

// Genera un identificador único para cada registro.
export function generarId() {
  return crypto.randomUUID();
}
