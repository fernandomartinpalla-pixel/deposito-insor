export type PedidoEtiqueta = {
  id?: number;
  cliente?: string | null;
  numero_factura?: string | null;
  qr_token?: string | null;
  direccion?: string | null;
  telefono_cliente?: string | null;
  departamento?: string | null;
  observaciones?: string | null;
};

export function imprimirEtiquetas(pedidos: PedidoEtiqueta[]) {
  const fecha = new Date().toLocaleDateString("es-UY");

  const etiquetasHtml = pedidos
    .map((pedido) => {
      const qrUrl = `https://deposito-insor.vercel.app/entrega/${
        pedido.qr_token ?? ""
      }`;

      return `
        <div class="label">
          <div class="header">
            <div class="brand">INSOR</div>
            <div class="brand-sub">INSOR INTERNACIONAL SAS</div>
          </div>

          <div class="section remitente">
            <div class="section-title">REMITENTE</div>
            <div class="text-bold">INSOR INTERNACIONAL SAS</div>
            <div>Av. General Flores 3289 - Montevideo</div>
            <div>Tel: 2203 7185</div>
            <div>RUT: 219 728 700 011</div>
          </div>

          <div class="section destinatario">
            <div class="section-title">DESTINATARIO</div>
            <div class="cliente">${pedido.cliente ?? "-"}</div>
            <div class="direccion">${pedido.direccion ?? "-"}</div>
            <div class="departamento">${pedido.departamento ?? "-"}</div>
            <div class="telefono">Tel: ${pedido.telefono_cliente ?? "-"}</div>
          </div>

          <div class="datos">
            <div><strong>Factura:</strong> ${pedido.numero_factura ?? "-"}</div>
            <div><strong>Fecha:</strong> ${fecha}</div>
          </div>

          <div class="qr-area">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
                qrUrl
              )}"
            />
            <div class="qr-text">ESCANEAR AL ENTREGAR</div>
          </div>

          ${
            pedido.observaciones
              ? `
                <div class="obs">
                  <div class="section-title">OBSERVACIONES</div>
                  <div>${pedido.observaciones}</div>
                </div>
              `
              : ""
          }
        </div>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Etiquetas Insor</title>
        <style>
          @page {
            size: 100mm 150mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
            color: #111;
            font-family: Arial, sans-serif;
          }

          .label {
            width: 100mm;
            height: 150mm;
            padding: 5mm;
            page-break-after: always;
            overflow: hidden;
            border: 2px solid #111;
          }

          .header {
            background: #111;
            color: white;
            text-align: center;
            padding: 4mm 2mm;
            margin-bottom: 4mm;
          }

          .brand {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 2px;
          }

          .brand-sub {
            font-size: 11px;
            font-weight: 700;
            margin-top: 1mm;
          }

          .section {
            border: 2px solid #111;
            padding: 3mm;
            margin-bottom: 3mm;
          }

          .section-title {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1px;
            margin-bottom: 2mm;
          }

          .text-bold {
            font-weight: 900;
          }

          .remitente {
            font-size: 12px;
            line-height: 1.35;
          }

          .destinatario {
            min-height: 38mm;
          }

          .cliente {
            font-size: 24px;
            font-weight: 900;
            line-height: 1.1;
            margin-bottom: 3mm;
            text-transform: uppercase;
          }

          .direccion {
            font-size: 17px;
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 2mm;
          }

          .departamento {
            font-size: 20px;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 2mm;
          }

          .telefono {
            font-size: 15px;
            font-weight: 800;
          }

          .datos {
            display: flex;
            justify-content: space-between;
            gap: 3mm;
            border: 2px solid #111;
            padding: 3mm;
            font-size: 13px;
            margin-bottom: 3mm;
          }

          .qr-area {
            text-align: center;
            margin-top: 2mm;
            margin-bottom: 3mm;
          }

          .qr-area img {
            width: 45mm;
            height: 45mm;
            display: block;
            margin: 0 auto;
          }

          .qr-text {
            margin-top: 2mm;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 1px;
          }

          .obs {
            border: 2px dashed #111;
            padding: 3mm;
            font-size: 12px;
            font-weight: 700;
            line-height: 1.25;
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