"use client";

type Props = {
  enReparto: number;
  prontosDeposito: number;
  historial: number;
  papelera: number;
  clientes: number;
  cargando?: boolean;
};

export default function ResumenDeposito({
  enReparto,
  prontosDeposito,
  historial,
  papelera,
  clientes,
  cargando = false,
}: Props) {
  const totalOperativo = enReparto + prontosDeposito;
  const totalVisible = enReparto + prontosDeposito + historial;
  const porcentajeReparto =
    totalOperativo > 0 ? Math.round((enReparto / totalOperativo) * 100) : 0;

  return (
    <section className="mb-8">
      <div className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-7 shadow-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
          Depósito Insor V3.2
        </p>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white">
              Panel operativo
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Control de pedidos, reparto, depósito, historial y etiquetas.
              {cargando ? " Actualizando datos..." : ""}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-cyan-300">
              Operativos
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              {totalOperativo}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>Pedidos en reparto sobre operación activa</span>
            <span>{porcentajeReparto}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all"
              style={{ width: `${porcentajeReparto}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          titulo="En reparto"
          valor={enReparto}
          icono="🚚"
          detalle="Pedidos cargados para salir"
          color="cyan"
        />

        <KpiCard
          titulo="En depósito"
          valor={prontosDeposito}
          icono="📦"
          detalle="Pendientes de preparar"
          color="yellow"
        />

        <KpiCard
          titulo="Entregados"
          valor={historial}
          icono="✅"
          detalle="Visibles según filtro"
          color="green"
        />

        <KpiCard
          titulo="Papelera"
          valor={papelera}
          icono="🗑️"
          detalle="Pedidos archivados"
          color="red"
        />

        <KpiCard
          titulo="Clientes"
          valor={clientes}
          icono="👥"
          detalle="Base importada"
          color="purple"
        />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Total visible en pantalla: {totalVisible} pedidos.
      </p>
    </section>
  );
}

function KpiCard({
  titulo,
  valor,
  icono,
  detalle,
  color,
}: {
  titulo: string;
  valor: number;
  icono: string;
  detalle: string;
  color: "cyan" | "yellow" | "green" | "red" | "purple";
}) {
  const clases =
    color === "cyan"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
      : color === "yellow"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
      : color === "green"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : color === "red"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : "border-purple-500/30 bg-purple-500/10 text-purple-300";

  return (
    <div className={`rounded-3xl border p-5 shadow-xl ${clases}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl">{icono}</span>
        <span className="rounded-full bg-slate-950/50 px-3 py-1 text-xs font-bold">
          V3.2
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-300">{titulo}</p>

      <p className="mt-2 text-4xl font-black text-white">{valor}</p>

      <p className="mt-2 text-xs text-slate-400">{detalle}</p>
    </div>
  );
}