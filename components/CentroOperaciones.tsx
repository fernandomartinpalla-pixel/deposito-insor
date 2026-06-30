"use client";

import type { Entrega } from "@/types/entrega";
import { usd } from "@/lib/formato";

type Props = {
  enReparto: Entrega[];
  prontosDeposito: Entrega[];
  historial: Entrega[];
};

export default function CentroOperaciones({
  enReparto,
  prontosDeposito,
  historial,
}: Props) {
  const activos = [...enReparto, ...prontosDeposito];
  const totalActivos = activos.length;
  const totalEntregados = historial.length;

  const criticos = activos.filter((p) => p.prioridad === "critico").length;
  const urgentes = activos.filter((p) => p.prioridad === "urgente").length;
  const sinTelefono = activos.filter((p) => !p.telefono_cliente).length;

  const montoActivo = activos.reduce(
    (total, p) => total + Number(p.monto || 0),
    0
  );

  const porcentajeEntregado =
    totalActivos + totalEntregados > 0
      ? Math.round((totalEntregados / (totalActivos + totalEntregados)) * 100)
      : 0;

  return (
    <section className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-7 shadow-2xl">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-400">
            Centro de operaciones
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            Depósito Insor
          </h1>

          <p className="mt-2 text-slate-400">
            Vista rápida del estado operativo actual.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniKpi titulo="Activos" valor={totalActivos} />
          <MiniKpi titulo="Reparto" valor={enReparto.length} />
          <MiniKpi titulo="Depósito" valor={prontosDeposito.length} />
          <MiniKpi titulo="Monto" valor={usd(montoActivo)} />
        </div>
      </div>

      <div className="mt-7">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Progreso visible</span>
          <span>{porcentajeEntregado}% entregado</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{ width: `${porcentajeEntregado}%` }}
          />
        </div>
      </div>

      {(criticos > 0 || urgentes > 0 || sinTelefono > 0) && (
        <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="mb-3 text-sm font-bold text-yellow-300">
            🔔 Alertas rápidas
          </p>

          <div className="grid gap-2 text-sm text-slate-200 md:grid-cols-3">
            {criticos > 0 && <Alerta texto={`${criticos} pedido(s) crítico(s)`} />}
            {urgentes > 0 && <Alerta texto={`${urgentes} pedido(s) urgente(s)`} />}
            {sinTelefono > 0 && <Alerta texto={`${sinTelefono} pedido(s) sin teléfono`} />}
          </div>
        </div>
      )}
    </section>
  );
}

function MiniKpi({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-black text-white">{valor}</p>
    </div>
  );
}

function Alerta({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl bg-slate-950/60 px-4 py-3">
      {texto}
    </div>
  );
}