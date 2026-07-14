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
        <section class="label">
          <div class="top">
            <div class="logo">INSOR</div>
            <div class="empresa">
              <div class="empresa-nombre">INSOR INTERNACIONAL SAS</div>
              <div>Av. General Flores 3289 - Montevideo</div>
              <div>Tel. 2203 7185</div>
            </div>
          </div>

          <div class="destino">
            <div class="tag">DESTINATARIO</div>
            <div class="cliente">${limpiar(pedido.cliente)}</div>
            <div class="direccion">${limpiar(pedido.direccion)}</div>
            <div class="departamento">${limpiar(pedido.departamento)}</div>
            <div class="telefono">TEL. ${limpiar(pedido.telefono_cliente)}</div>
          </div>

          <div class="abajo">
            <div class="datos">
              <div><b>FACTURA</b><span>${limpiar(pedido.numero_factura)}</span></div>
              <div><b>PEDIDO</b><span>#${pedido.id ?? "-"}</span></div>
              <div><b>FECHA</b><span>${fecha}</span></div>
              <div class="cuidado">ESCANEA AL RECIBIR PARA HACERNOS SABER QUE RECIBISTE</div>
            </div>
            <div class="qr">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
                qrUrl
              )}" />
              <div>ESCANEAR AL ENTREGAR</div>
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Etiquetas INSOR</title>

        <style>
          @page {
            size: 150mm 100mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            width: 150mm;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
            font-family: Arial, Helvetica, sans-serif;
          }

          .label {
            width: 150mm;
            height: 100mm;
            padding: 5mm;
            page-break-after: always;
            overflow: hidden;
            border: 2px solid #000;
            background: white;
          }

          .top {
            height: 20mm;
            display: flex;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 3mm;
          }

          .logo {
            width: 38mm;
            height: 14mm;
            background: black;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 25pt;
            font-weight: 900;
            letter-spacing: 1px;
          }

          .empresa {
            margin-left: 5mm;
            line-height: 1.15;
          }

          .empresa-nombre {
            font-size: 16pt;
            font-weight: 800;
            margin-bottom: 1mm;
          }

          .empresa div:not(.empresa-nombre) {
            font-size: 10pt;
            font-weight: 700;
          }

          .destino {
            height: 43mm;
            text-align: center;
            padding-top: 3mm;
            border-bottom: 2px solid #000;
          }

          .tag {
            display: inline-block;
            background: black;
            color: white;
            font-size: 12pt;
            font-weight: 800;
            letter-spacing: 1px;
            padding: 1.5mm 8mm;
            margin-bottom: 3mm;
          }

          .cliente {
            font-size: 12pt;
            font-weight: 800;
            line-height: 1;
            text-transform: uppercase;
            margin-bottom: 3mm;
          }

          .direccion {
            font-size: 12pt;
            font-weight: 800;
            text-transform: uppercase;
            line-height: 0.2;
            margin-bottom: 2mm;
          }

          .departamento {
            font-size: 12pt;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 2mm;
          }

          .telefono {
            font-size: 12pt;
            font-weight: 800;
          }

          .abajo {
            height: 27mm;
            display: flex;
            padding-top: 3mm;
          }

          .datos {
            width: 83mm;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 2mm;
            padding-right: 2mm;
          }

          .datos div {
            border: 1px solid #000;
            text-align: center;
            padding: 0mm;
            height: 11mm;
          }

          .datos b {
            display: block;
            font-size: 10pt;
            margin-bottom: 1mm;
          }

          .datos span {
            display: block;
            font-size: 10pt;
            font-weight: 900;
          }

          .datos .cuidado {
            grid-column: span 3;
            height: 9mm;
            font-size: 9pt;
            font-weight: 900;
            padding-top: 0mm;
          }

          .qr {
            width: 60mm;
            text-align: center;
            border-left: 2px solid #000;
            padding-left: 0mm;
          }

          .qr img {
            width: 29mm;
            height: 29mm;
            display: block;
            margin: -2mm auto 1mm;
          }

          .qr div {
            display: inline-block;
            background: black;
            color: white;
            font-size: 4pt;
            font-weight: 800;
            padding: 1mm 0mm;
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