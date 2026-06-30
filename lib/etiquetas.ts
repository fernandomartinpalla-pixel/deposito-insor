export type PedidoEtiqueta = {
  cliente: string;
  numero_factura: string;
  direccion?: string | null;
  telefono_cliente?: string | null;
  departamento?: string | null;
  observaciones?: string | null;
};

export function imprimirEtiquetas(pedidos: PedidoEtiqueta[]) {
  const fecha = new Date().toLocaleDateString("es-UY");

  const etiquetasHtml = pedidos
    .map(
      (pedido) => `
        <div class="label">
          <div class="top">
            <div class="logo">INSOR</div>
            <div class="empresa">INSOR INTERNACIONAL SAS</div>
            <div class="fecha">
              <div class="fecha-title">FECHA</div>
              <div class="fecha-value">${fecha}</div>
            </div>
          </div>

          <div class="middle">
            <div class="box">
              <div class="box-title">REMITENTE</div>
              <div class="line"><div class="value">INSOR INTERNACIONAL SAS</div></div>
              <div class="line"><div class="value small">AV. GENERAL FLORES 3289, MVD</div></div>
              <div class="line"><div class="value small">2203 7185</div></div>
              <div class="line"><div class="value small">RUT 219 728 700 011</div></div>
            </div>

            <div class="box">
              <div class="box-title">DESTINATARIO</div>

              <div class="line">
                <div class="label-title">Cliente</div>
                <div class="value">${pedido.cliente || "-"}</div>
              </div>

              <div class="line">
                <div class="label-title">Dirección</div>
                <div class="value small">${pedido.direccion || "-"}</div>
              </div>

              <div class="line">
                <div class="label-title">Teléfono</div>
                <div class="value small">${pedido.telefono_cliente || "-"}</div>
              </div>

              <div class="line">
                <div class="label-title">Departamento</div>
                <div class="value small">${pedido.departamento || "-"}</div>
              </div>
            </div>
          </div>
         <div class="qr-area">

  <div class="qr-box">

    <img
      src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        `${window.location.origin}/entrega/${pedido.qr_token}`
      )}"
    />

  </div>

  <div class="qr-text">
    Escanear al entregar
  </div>

</div>
          <div class="bottom">
            <div class="small-box">
              <div class="label-title">Agencia</div>
              <div class="value small">__________________</div>
            </div>

            <div class="small-box">
              <div class="label-title">Cantidad de bultos</div>
              <div class="value small">________</div>
            </div>
          </div>

          <div class="warning">
            <div>
              <div class="warning-title">MANIPULAR MERCADERÍA CON PRECAUCIÓN</div>
              <div class="warning-sub">
                CUALQUIER PROBLEMA RELACIONADO CON LA MERCADERÍA<br/>
                COMUNICARSE CON LOGÍSTICA: 097 995 530
              </div>
            </div>

            <div class="fragil">
              <div class="fragil-top">CUIDADO</div>
              <div class="fragil-icon">🍷</div>
              <div class="fragil-bottom">FRÁGIL</div>
            </div>
          </div>

          ${
            pedido.observaciones
              ? `
                <div class="obs">
                  <div class="obs-title">OBSERVACIONES</div>
                  <div class="obs-text">${pedido.observaciones}</div>
                </div>
              `
              : ""
          }
        </div>
      `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Etiquetas Depósito Insor</title>
        <style>
          @page { size: A4; margin: 8mm; }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            color: #111;
            background: white;
          }

          .label {
            border: 2px solid #111;
            padding: 14px;
            margin-bottom: 12px;
            page-break-inside: avoid;
          }

          .top {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
          }

          .logo {
            width: 130px;
            border: 2px solid #111;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            font-weight: 900;
          }

          .empresa {
            flex: 1;
            border: 2px solid #111;
            padding: 10px;
            font-size: 24px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .fecha {
            width: 140px;
            border: 2px solid #111;
            padding: 10px;
          }

          .fecha-title {
            font-size: 13px;
            font-weight: 900;
            margin-bottom: 6px;
          }

          .fecha-value {
            font-size: 22px;
            font-weight: 700;
          }

          .middle {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
          }

          .box {
            flex: 1;
            border: 2px solid #111;
            padding: 12px;
            min-height: 190px;
            box-sizing: border-box;
          }

          .box-title {
            text-align: center;
            font-size: 16px;
            font-weight: 900;
            text-decoration: underline;
            margin-bottom: 14px;
          }

          .line { margin-bottom: 11px; }

          .label-title {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 3px;
          }

          .value {
            font-size: 18px;
            font-weight: 700;
            line-height: 1.25;
          }

          .small { font-size: 15px; }

          .bottom {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
          }

          .small-box {
            flex: 1;
            border: 2px solid #111;
            padding: 10px;
            min-height: 55px;
          }

          .warning {
            border: 2px solid #111;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
          }

          .warning-title {
            font-size: 18px;
            font-weight: 900;
            margin-bottom: 8px;
          }

          .warning-sub {
            font-size: 12px;
            font-weight: 700;
            line-height: 1.4;
          }

          .fragil {
            width: 105px;
            height: 105px;
            background: #d60000;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            border: 2px solid #111;
          }

          .fragil-top { font-size: 19px; }
          .fragil-icon { font-size: 36px; }
          .fragil-bottom { font-size: 19px; }

          .obs {
            margin-top: 10px;
            border: 2px dashed #111;
            padding: 9px;
          }

          .obs-title {
            font-size: 12px;
            font-weight: 900;
            margin-bottom: 5px;
          }

          .obs-text {
            font-size: 12px;
            line-height: 1.4;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            .qr-area{
display:flex;
flex-direction:column;

align-items:center;

margin-top:12px;

margin-bottom:12px;
}

.qr-box{

border:2px solid #111;

padding:8px;

background:white;

}

.qr-box img{

width:160px;

height:160px;

display:block;

}

.qr-text{

margin-top:8px;

font-size:12px;

font-weight:900;

}
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
            }, 800);
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