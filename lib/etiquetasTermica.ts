export type PedidoEtiquetaTermica = {
  id?: number;
  cliente?: string | null;
  numero_factura?: string | null;
  qr_token?: string | null;
  direccion?: string | null;
  telefono_cliente?: string | null;
  departamento?: string | null;
  observaciones?: string | null;
};

const BASE_URL = "https://deposito-insor.vercel.app";

function limpiar(valor?: string | null) {
  return valor && valor.trim() ? valor.trim() : "-";
}

export function imprimirEtiquetasTermica(pedidos: PedidoEtiquetaTermica[]) {
  const fecha = new Date().toLocaleDateString("es-UY");

  const etiquetasHtml = pedidos
    .map((pedido) => {
      const qrUrl = `${BASE_URL}/entrega/${pedido.qr_token ?? ""}`;

      return `
        <section class="etiqueta">
          <header class="encabezado">
            <div class="logo">INSOR</div>
            <div class="empresa">
              <strong>INSOR INTERNACIONAL SAS</strong>
              <span>Remitente · Av. General Flores 3289 · Montevideo · Tel. 2203 7185</span>
            </div>
          </header>

          <section class="destinatario">
            <div class="titulo">DESTINATARIO</div>
            <div class="nombre">${limpiar(pedido.cliente)}</div>
            <div class="direccion">${limpiar(pedido.direccion)}</div>
            <div class="departamento">${limpiar(pedido.departamento)}</div>
            <div class="telefono">TEL: ${limpiar(pedido.telefono_cliente)}</div>
          </section>

          <section class="datos">
            <div>
              <span>FACTURA</span>
              <strong>${limpiar(pedido.numero_factura)}</strong>
            </div>

            <div>
              <span>FECHA</span>
              <strong>${fecha}</strong>
            </div>

            <div>
              <span>PEDIDO</span>
              <strong>#${pedido.id ?? "-"}</strong>
            </div>
          </section>

          <section class="qr">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
                qrUrl
              )}"
              alt="QR entrega"
            />
            <div class="qr-text">ESCANEAR AL ENTREGAR</div>
            <div class="qr-code">${(pedido.qr_token ?? "").slice(0, 8).toUpperCase()}</div>
          </section>

          ${
            pedido.observaciones
              ? `
                <section class="observaciones">
                  <strong>OBS:</strong> ${pedido.observaciones}
                </section>
              `
              : `
                <section class="observaciones vacia">
                  MANIPULAR MERCADERÍA CON PRECAUCIÓN
                </section>
              `
          }
        </section>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Etiquetas térmicas INSOR</title>

        <style>
          @page {
            size: 100mm 150mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 100mm;
            margin: 0;
            padding: 0;
            background: white;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
          }

          .etiqueta {
            width: 100mm;
            height: 150mm;
            padding: 5mm;
            page-break-after: always;
            overflow: hidden;
            background: white;
          }

          .encabezado {
            display: flex;
            border: 2px solid #000;
            margin-bottom: 4mm;
          }

          .logo {
            width: 27mm;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 19pt;
            font-weight: 900;
            letter-spacing: 1px;
          }

          .empresa {
            flex: 1;
            padding: 3mm;
            font-size: 9pt;
            line-height: 1.25;
          }

          .empresa strong {
            display: block;
            font-size: 12pt;
            margin-bottom: 1mm;
          }

          .empresa span {
            display: block;
            font-weight: 700;
          }

          .destinatario {
            border: 2px solid #000;
            padding: 4mm;
            margin-bottom: 4mm;
            min-height: 43mm;
          }

          .titulo {
            font-size: 9pt;
            font-weight: 900;
            letter-spacing: 1px;
            margin-bottom: 2mm;
          }

          .nombre {
            font-size: 24pt;
            font-weight: 900;
            line-height: 1;
            text-transform: uppercase;
            margin-bottom: 3mm;
          }

          .direccion {
            font-size: 15pt;
            font-weight: 900;
            line-height: 1.12;
            margin-bottom: 2mm;
          }

          .departamento {
            font-size: 18pt;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 2mm;
          }

          .telefono {
            font-size: 12pt;
            font-weight: 900;
          }

          .datos {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            border: 2px solid #000;
            margin-bottom: 4mm;
          }

          .datos div {
            padding: 2.5mm;
            border-right: 2px solid #000;
            min-height: 14mm;
          }

          .datos div:last-child {
            border-right: none;
          }

          .datos span {
            display: block;
            font-size: 7pt;
            font-weight: 900;
            margin-bottom: 1mm;
          }

          .datos strong {
            display: block;
            font-size: 12pt;
            font-weight: 900;
          }

          .qr {
            text-align: center;
            margin-bottom: 4mm;
          }

          .qr img {
            width: 47mm;
            height: 47mm;
            display: block;
            margin: 0 auto;
          }

          .qr-text {
            font-size: 10pt;
            font-weight: 900;
            margin-top: 1mm;
            letter-spacing: 1px;
          }

          .qr-code {
            font-size: 8pt;
            font-weight: 900;
            margin-top: 1mm;
          }

          .observaciones {
            border: 2px dashed #000;
            padding: 3mm;
            font-size: 11pt;
            font-weight: 800;
            line-height: 1.2;
            min-height: 16mm;
          }

          .observaciones.vacia {
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        ${etiquetasHtml}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, "_blank");

  if (!ventana) {
    alert("El navegador bloqueó la impresión.");
  }
}