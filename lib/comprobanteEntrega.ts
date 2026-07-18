import type { Entrega } from "@/types/entrega";

function escaparHTML(valor: unknown): string {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatearFechaHora(fecha?: string | null): string {
  if (!fecha) return "Sin registrar";

  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fechaConvertida);
}

function formatearMonto(monto?: number | string | null): string {
  const numero = Number(monto);

  if (Number.isNaN(numero)) {
    return String(monto ?? "-");
  }

  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "USD",
  }).format(numero);
}

export function imprimirComprobanteEntrega(entrega: Entrega) {
  const ventana = window.open("", "_blank", "width=950,height=900");

  if (!ventana) {
    alert(
      "El navegador bloqueó la ventana del comprobante. Permití las ventanas emergentes e intentá nuevamente."
    );
    return;
  }

  const cliente = escaparHTML(entrega.cliente || "Cliente sin nombre");
  const factura = escaparHTML(entrega.numero_factura || "-");
  const recibidoPor = escaparHTML(
    entrega.recibido_por || "Sin registrar"
  );
  const observacion = escaparHTML(
    entrega.observacion_entrega || "Sin observaciones"
  );
  const direccion = escaparHTML(entrega.direccion || "-");
  const departamento = escaparHTML(entrega.departamento || "-");
  const telefono = escaparHTML(entrega.telefono_cliente || "-");
  const fechaEntrega = formatearFechaHora(
    entrega.fecha_entregado || entrega.fecha_entrega_programada
  );
  const monto = formatearMonto(entrega.monto);

  const fotoFactura = entrega.factura_firmada_url
    ? `
      <section class="foto-section">
        <div class="section-title">Factura firmada</div>

        <div class="foto-container">
          <img
            src="${escaparHTML(entrega.factura_firmada_url)}"
            alt="Factura firmada"
          />
        </div>
      </section>
    `
    : `
      <section class="foto-section">
        <div class="section-title">Factura firmada</div>

        <div class="sin-foto">
          No hay una fotografía registrada para esta entrega.
        </div>
      </section>
    `;

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>Comprobante de entrega - ${factura}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 28px;
            background: #e2e8f0;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
          }

          .comprobante {
            width: 100%;
            max-width: 820px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
          }

          .encabezado {
            padding: 34px 38px;
            background: #0f172a;
            color: white;
          }

          .empresa {
            margin: 0;
            font-size: 25px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }

          .subtitulo {
            margin-top: 7px;
            color: #94a3b8;
            font-size: 13px;
          }

          .estado {
            display: inline-block;
            margin-top: 22px;
            padding: 8px 14px;
            border-radius: 999px;
            background: #10b981;
            color: #052e16;
            font-size: 12px;
            font-weight: 800;
          }

          .contenido {
            padding: 34px 38px;
          }

          .titulo-principal {
            margin: 0 0 6px;
            font-size: 27px;
          }

          .numero-entrega {
            margin: 0 0 28px;
            color: #64748b;
            font-size: 13px;
          }

          .section-title {
            margin-bottom: 14px;
            color: #0f172a;
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }

          .datos {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .dato {
            padding: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            background: #f8fafc;
          }

          .dato-ancho {
            grid-column: 1 / -1;
          }

          .dato-label {
            margin-bottom: 6px;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .dato-value {
            color: #0f172a;
            font-size: 15px;
            font-weight: 700;
            overflow-wrap: anywhere;
          }

          .observacion {
            margin-top: 26px;
            padding: 18px;
            border-left: 5px solid #06b6d4;
            border-radius: 10px;
            background: #ecfeff;
          }

          .observacion-label {
            margin-bottom: 7px;
            color: #0e7490;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }

          .observacion-texto {
            white-space: pre-wrap;
            line-height: 1.5;
          }

          .foto-section {
            margin-top: 30px;
          }

          .foto-container {
            display: flex;
            justify-content: center;
            padding: 16px;
            border: 1px solid #cbd5e1;
            border-radius: 15px;
            background: #f8fafc;
          }

          .foto-container img {
            display: block;
            max-width: 100%;
            max-height: 720px;
            border-radius: 8px;
            object-fit: contain;
          }

          .sin-foto {
            padding: 28px;
            border: 1px dashed #cbd5e1;
            border-radius: 14px;
            color: #64748b;
            text-align: center;
          }

          .pie {
            padding: 22px 38px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
            color: #64748b;
            font-size: 11px;
            text-align: center;
          }

          .acciones {
            display: flex;
            justify-content: center;
            gap: 12px;
            max-width: 820px;
            margin: 20px auto 0;
          }

          .boton {
            border: none;
            border-radius: 12px;
            padding: 13px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 800;
          }

          .boton-imprimir {
            background: #06b6d4;
            color: #082f49;
          }

          .boton-cerrar {
            background: #334155;
            color: white;
          }

          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            body {
              padding: 0;
              background: white;
            }

            .comprobante {
              max-width: none;
              box-shadow: none;
              border-radius: 0;
            }

            .acciones {
              display: none;
            }

            .foto-container img {
              max-height: 590px;
            }
          }

          @media (max-width: 650px) {
            body {
              padding: 10px;
            }

            .encabezado,
            .contenido,
            .pie {
              padding-left: 20px;
              padding-right: 20px;
            }

            .datos {
              grid-template-columns: 1fr;
            }

            .dato-ancho {
              grid-column: auto;
            }
          }
        </style>
      </head>

      <body>
        <main class="comprobante">
          <header class="encabezado">
            <h1 class="empresa">INSOR INTERNACIONAL SAS</h1>

            <div class="subtitulo">
              Sistema de gestión logística y control de entregas
            </div>

            <div class="estado">✓ ENTREGA CONFIRMADA</div>
          </header>

          <section class="contenido">
            <h2 class="titulo-principal">Comprobante de entrega</h2>

            <p class="numero-entrega">
              Número interno de entrega: ${escaparHTML(entrega.id)}
            </p>

            <div class="section-title">Información de la entrega</div>

            <div class="datos">
              <div class="dato">
                <div class="dato-label">Cliente</div>
                <div class="dato-value">${cliente}</div>
              </div>

              <div class="dato">
                <div class="dato-label">Factura</div>
                <div class="dato-value">${factura}</div>
              </div>

              <div class="dato">
                <div class="dato-label">Fecha y hora</div>
                <div class="dato-value">${escaparHTML(fechaEntrega)}</div>
              </div>

              <div class="dato">
                <div class="dato-label">Monto</div>
                <div class="dato-value">${escaparHTML(monto)}</div>
              </div>

              <div class="dato">
                <div class="dato-label">Recibió</div>
                <div class="dato-value">${recibidoPor}</div>
              </div>

              <div class="dato">
                <div class="dato-label">Teléfono</div>
                <div class="dato-value">${telefono}</div>
              </div>

              <div class="dato dato-ancho">
                <div class="dato-label">Dirección</div>
                <div class="dato-value">
                  ${direccion} — ${departamento}
                </div>
              </div>
            </div>

            <div class="observacion">
              <div class="observacion-label">Observación de entrega</div>

              <div class="observacion-texto">${observacion}</div>
            </div>

            ${fotoFactura}
          </section>

          <footer class="pie">
            Comprobante generado por Insor Operaciones.
            La fotografía adjunta constituye evidencia de la entrega registrada.
          </footer>
        </main>

        <div class="acciones">
          <button
            class="boton boton-imprimir"
            onclick="window.print()"
          >
            🖨 Imprimir / Guardar PDF
          </button>

          <button
            class="boton boton-cerrar"
            onclick="window.close()"
          >
            Cerrar
          </button>
        </div>
      </body>
    </html>
  `);

  ventana.document.close();
  ventana.focus();
}