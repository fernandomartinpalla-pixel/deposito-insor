import type { Entrega } from "@/types/entrega";

function limpiarTexto(valor: unknown): string {
  return String(valor ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function celdaCSV(valor: unknown): string {
  const texto = limpiarTexto(valor).replace(/"/g, '""');

  return `"${texto}"`;
}

function fechaArchivo(): string {
  const hoy = new Date();

  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

export function exportarRutaCircuit(entregas: Entrega[]) {
  if (entregas.length === 0) {
    alert("No hay pedidos en reparto para exportar.");
    return;
  }

  const encabezados = [
    "Recipient Name",
    "Address",
    "City",
    "Phone",
    "External ID",
    "Notes",
  ];

  const filas = entregas.map((entrega) => {
    const direccionCompleta = [
      entrega.direccion,
      entrega.departamento,
      "Uruguay",
    ]
      .filter(Boolean)
      .join(", ");

    const notas = [
      entrega.numero_factura
        ? `Factura: ${entrega.numero_factura}`
        : "",
      entrega.observaciones
        ? `Observaciones: ${entrega.observaciones}`
        : "",
      entrega.prioridad
        ? `Prioridad: ${entrega.prioridad}`
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    return [
      celdaCSV(entrega.cliente),
      celdaCSV(direccionCompleta),
      celdaCSV(entrega.departamento || ""),
      celdaCSV(entrega.telefono_cliente || ""),
      celdaCSV(entrega.id),
      celdaCSV(notas),
    ].join(",");
  });

  const contenido = [
    encabezados.map(celdaCSV).join(","),
    ...filas,
  ].join("\r\n");

  // El BOM permite que Excel y otras aplicaciones reconozcan bien
  // las tildes, la ñ y demás caracteres.
  const archivo = new Blob(["\uFEFF", contenido], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = `ruta-circuit-${fechaArchivo()}.csv`;

  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);

  URL.revokeObjectURL(url);
}