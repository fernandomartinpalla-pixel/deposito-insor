"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import LayoutOperaciones from "@/components/LayoutOperaciones";
import { obtenerHistorialCliente } from "@/lib/historial-clientes";
import type {
  HistorialCliente,
  MovimientoHistorial,
  TipoMovimientoHistorial,
} from "@/types/historial-cliente";

type Filtro = "todos" | TipoMovimientoHistorial;

const filtros: Array<{ valor: Filtro; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todo" },
  { valor: "visita", etiqueta: "Visitas" },
  { valor: "pedido", etiqueta: "Pedidos" },
  { valor: "entrega", etiqueta: "Entregas" },
  { valor: "cobro", etiqueta: "Cobros" },
];

const estilosMovimiento: Record<
  TipoMovimientoHistorial,
  { icono: string; etiqueta: string; borde: string; fondo: string; texto: string }
> = {
  visita: {
    icono: "👤",
    etiqueta: "Visita",
    borde: "border-amber-500/25",
    fondo: "bg-amber-500/10",
    texto: "text-amber-200",
  },
  pedido: {
    icono: "📦",
    etiqueta: "Pedido",
    borde: "border-violet-500/25",
    fondo: "bg-violet-500/10",
    texto: "text-violet-200",
  },
  entrega: {
    icono: "🚚",
    etiqueta: "Entrega",
    borde: "border-cyan-500/25",
    fondo: "bg-cyan-500/10",
    texto: "text-cyan-200",
  },
  cobro: {
    icono: "💰",
    etiqueta: "Cobro",
    borde: "border-emerald-500/25",
    fondo: "bg-emerald-500/10",
    texto: "text-emerald-200",
  },
};

function fecha(fechaISO: string | null): string {
  if (!fechaISO) return "Sin datos";
  const valor = new Date(fechaISO);
  if (Number.isNaN(valor.getTime())) return "Sin datos";

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(valor);
}

function fechaHora(fechaISO: string): string {
  const valor = new Date(fechaISO);
  if (Number.isNaN(valor.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(valor);
}

function dinero(valor: number, moneda: "UYU" | "USD") {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(valor);
}

function diasDesde(fechaISO: string | null): number | null {
  if (!fechaISO) return null;
  const valor = new Date(fechaISO);
  if (Number.isNaN(valor.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - valor.getTime()) / 86_400_000));
}

function Indicador({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: string | number;
  detalle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/10">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {titulo}
      </p>
      <p className="mt-2 text-xl font-black text-white sm:text-2xl">{valor}</p>
      {detalle ? <p className="mt-1 text-xs text-slate-400">{detalle}</p> : null}
    </div>
  );
}

function Movimiento({ movimiento }: { movimiento: MovimientoHistorial }) {
  const estilo = estilosMovimiento[movimiento.tipo];
  const monto =
    movimiento.monto !== null && movimiento.moneda
      ? dinero(movimiento.monto, movimiento.moneda)
      : movimiento.monto !== null
        ? `$ ${new Intl.NumberFormat("es-UY").format(movimiento.monto)}`
        : null;

  return (
    <article className={`rounded-2xl border ${estilo.borde} ${estilo.fondo} p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-xl">
          {estilo.icono}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.16em] ${estilo.texto}`}>
                {estilo.etiqueta}
              </p>
              <h3 className="mt-1 text-base font-black text-white">
                {movimiento.titulo}
              </h3>
            </div>
            <time className="text-xs font-semibold text-slate-400">
              {fechaHora(movimiento.fecha)}
            </time>
          </div>

          {movimiento.descripcion ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
              {movimiento.descripcion}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 font-bold text-slate-300">
              {movimiento.estado}
            </span>
            {movimiento.factura ? (
              <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 font-bold text-slate-300">
                Factura {movimiento.factura}
              </span>
            ) : null}
            {movimiento.responsable ? (
              <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 font-bold text-slate-300">
                {movimiento.responsable}
              </span>
            ) : null}
            {monto ? (
              <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 font-black text-white">
                {monto}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HistorialClientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clienteId = Number(params.id);

  const [historial, setHistorial] = useState<HistorialCliente | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        setCargando(true);
        setError(null);
        const resultado = await obtenerHistorialCliente(clienteId);
        if (activo) setHistorial(resultado);
      } catch (errorDesconocido) {
        if (!activo) return;
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar el historial.",
        );
      } finally {
        if (activo) setCargando(false);
      }
    }

    if (Number.isInteger(clienteId) && clienteId > 0) {
      void cargar();
    } else {
      setError("El cliente indicado no es válido.");
      setCargando(false);
    }

    return () => {
      activo = false;
    };
  }, [clienteId]);

  const movimientos = useMemo(() => {
    if (!historial) return [];
    return filtro === "todos"
      ? historial.movimientos
      : historial.movimientos.filter((item) => item.tipo === filtro);
  }, [historial, filtro]);

  if (cargando) {
    return (
      <LayoutOperaciones titulo="CRM Clientes">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-5">
            <div className="h-48 rounded-3xl bg-slate-900" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, indice) => (
                <div key={indice} className="h-28 rounded-2xl bg-slate-900" />
              ))}
            </div>
            <div className="h-80 rounded-3xl bg-slate-900" />
          </div>
        </main>
      </LayoutOperaciones>
    );
  }

  if (error || !historial) {
    return (
      <LayoutOperaciones titulo="CRM Clientes">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-xl rounded-3xl border border-red-500/25 bg-slate-900 p-7 text-center shadow-2xl">
            <div className="text-5xl">⚠️</div>
            <h1 className="mt-4 text-2xl font-black text-white">
              No pudimos abrir el historial
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
              >
                Volver
              </button>
              <Link
                href="/clientes"
                className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-400"
              >
                Abrir Clientes
              </Link>
            </div>
          </div>
        </main>
      </LayoutOperaciones>
    );
  }

  const { cliente, resumen } = historial;
  const telefonoLimpio = (cliente.telefono ?? "").replace(/[^\d+]/g, "");
  const ultimaVisitaDias = diasDesde(resumen.ultima_visita);
  const alertaVisita = ultimaVisitaDias === null || ultimaVisitaDias >= 30;

  return (
    <LayoutOperaciones titulo="CRM Clientes">
      <main className="p-3 sm:p-5 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <header className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/70 shadow-2xl shadow-black/20">
            <div className="p-5 sm:p-7">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                ← Volver
              </button>

              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-400">
                    Ficha comercial · CRM
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {cliente.nombre}
                  </h1>

                  <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-slate-300 sm:flex-row sm:flex-wrap sm:gap-x-5">
                    {cliente.direccion ? <span>📍 {cliente.direccion}</span> : null}
                    {cliente.departamento ? <span>🗺️ {cliente.departamento}</span> : null}
                    {cliente.telefono ? <span>☎️ {cliente.telefono}</span> : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-xl lg:justify-end">
                  {telefonoLimpio ? (
                    <a
                      href={`tel:${telefonoLimpio}`}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-200 transition hover:bg-emerald-500/20"
                    >
                      📞 Llamar
                    </a>
                  ) : null}
                  <Link
                    href={`/visitas?cliente=${encodeURIComponent(cliente.nombre)}`}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-black text-amber-200 transition hover:bg-amber-500/20"
                  >
                    + Visita
                  </Link>
                  <Link
                    href={`/cobros?cliente=${encodeURIComponent(cliente.nombre)}`}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    + Cobro
                  </Link>
                  <Link
                    href={`/entregas?cliente=${encodeURIComponent(cliente.nombre)}`}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center text-sm font-black text-cyan-200 transition hover:bg-cyan-500/20"
                  >
                    + Entrega
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador titulo="Visitas" valor={resumen.visitas} detalle="Contactos comerciales" />
            <Indicador titulo="Pedidos" valor={resumen.pedidos} detalle="Pedidos registrados" />
            <Indicador titulo="Entregas" valor={resumen.entregas} detalle="Entregas completadas" />
            <Indicador titulo="Cobros" valor={resumen.cobros} detalle="Gestiones de cobro" />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador titulo="Pendiente UYU" valor={dinero(resumen.pendiente_uyu, "UYU")} />
            <Indicador titulo="Pendiente USD" valor={dinero(resumen.pendiente_usd, "USD")} />
            <Indicador titulo="Última visita" valor={fecha(resumen.ultima_visita)} />
            <Indicador titulo="Próxima visita" valor={fecha(resumen.proxima_visita)} />
          </section>

          <section
            className={`rounded-3xl border p-5 ${
              alertaVisita
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-emerald-500/25 bg-emerald-500/10"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{alertaVisita ? "💡" : "✅"}</div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Inteligencia comercial
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  {alertaVisita
                    ? "Este cliente merece seguimiento"
                    : "Relación comercial activa"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {ultimaVisitaDias === null
                    ? "No encontramos una visita realizada. Conviene agendar el primer contacto comercial."
                    : ultimaVisitaDias >= 30
                      ? `Pasaron ${ultimaVisitaDias} días desde la última visita. Recomendamos contactarlo esta semana.`
                      : `La última visita fue hace ${ultimaVisitaDias} días. El seguimiento está dentro de un plazo saludable.`}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                  Actividad comercial
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">Historial completo</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Visitas, pedidos, entregas y cobros en una sola línea de tiempo.
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {filtros.map((opcion) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setFiltro(opcion.valor)}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-black transition ${
                      filtro === opcion.valor
                        ? "border-cyan-400 bg-cyan-500 text-slate-950"
                        : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {movimientos.length > 0 ? (
                movimientos.map((item) => <Movimiento key={item.id} movimiento={item} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-14 text-center">
                  <div className="text-4xl">📭</div>
                  <p className="mt-3 font-black text-white">No hay movimientos para mostrar</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Los registros nuevos aparecerán aquí automáticamente.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </LayoutOperaciones>
  );
}
