"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LayoutOperaciones from "@/components/LayoutOperaciones";
import Card from "@/components/ui/Card";
import { cargarCobros } from "@/lib/cobros";
import {
  cargarPedidosEnReparto,
  cargarPedidosProntosDeposito,
} from "@/lib/entregas";
import { cargarVisitas } from "@/lib/visitas";

type Registro = Record<string, any>;

export default function Home() {
  const [entregas, setEntregas] = useState<Registro[]>([]);
  const [cobros, setCobros] = useState<Registro[]>([]);
  const [visitas, setVisitas] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarResumen();
  }, []);

  async function cargarResumen() {
    try {
      setCargando(true);

      const [enReparto, enDeposito, listaCobros, listaVisitas] =
        await Promise.all([
          cargarPedidosEnReparto(),
          cargarPedidosProntosDeposito(),
          cargarCobros(),
          cargarVisitas(),
        ]);

      setEntregas([...(enReparto || []), ...(enDeposito || [])]);
      setCobros(listaCobros || []);
      setVisitas(listaVisitas || []);
    } catch (error) {
      console.error("No se pudo cargar el resumen del dashboard:", error);
    } finally {
      setCargando(false);
    }
  }

  const hoy = fechaLocalISO();

  const resumen = useMemo(() => {
    const entregasHoy = entregas.filter((item) => {
      const fecha = obtenerFecha(item, [
        "fecha_entrega_programada",
        "fecha_entrega",
      ]);

      return fecha === hoy && item.estado !== "entregado";
    });

    const cobrosHoy = cobros.filter((item) => {
      const fecha = obtenerFecha(item, ["fecha_programada"]);

      return fecha === hoy && item.estado === "pendiente";
    });

    const visitasHoy = visitas.filter((item) => {
      const fecha = obtenerFecha(item, ["fecha_programada"]);

      return (
        fecha === hoy &&
        item.estado !== "realizada" &&
        item.estado !== "cancelada"
      );
    });

    const entregasVencidas = entregas.filter((item) => {
      const fecha = obtenerFecha(item, [
        "fecha_entrega_programada",
        "fecha_entrega",
      ]);

      return Boolean(fecha && fecha < hoy && item.estado !== "entregado");
    });

    const cobrosVencidos = cobros.filter((item) => {
      const fecha = obtenerFecha(item, ["fecha_programada"]);

      return Boolean(fecha && fecha < hoy && item.estado === "pendiente");
    });

    const visitasVencidas = visitas.filter((item) => {
      const fecha = obtenerFecha(item, ["fecha_programada"]);

      return Boolean(
        fecha &&
          fecha < hoy &&
          item.estado !== "realizada" &&
          item.estado !== "cancelada"
      );
    });

    const totalCobrosUYU = cobrosHoy
      .filter((item) => item.moneda === "UYU")
      .reduce((total, item) => total + Number(item.monto || 0), 0);

    const totalCobrosUSD = cobrosHoy
      .filter((item) => item.moneda === "USD")
      .reduce((total, item) => total + Number(item.monto || 0), 0);

    return {
      entregasHoy,
      cobrosHoy,
      visitasHoy,
      vencidos:
        entregasVencidas.length +
        cobrosVencidos.length +
        visitasVencidas.length,
      entregasVencidas,
      cobrosVencidos,
      visitasVencidas,
      totalCobrosUYU,
      totalCobrosUSD,
    };
  }, [entregas, cobros, visitas, hoy]);

  return (
    <LayoutOperaciones titulo="Dashboard">
      <main className="p-3 sm:p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                INSOR OPERACIONES
              </p>

              <h1 className="mt-3 text-4xl font-black lg:text-6xl">
                Centro de operaciones
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                Resumen de lo que tenés para hoy y accesos a todos los módulos.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarResumen}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              ↻ Actualizar
            </button>
          </div>

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador
              href="/entregas"
              icono="🚚"
              titulo="Entregas hoy"
              valor={cargando ? "..." : String(resumen.entregasHoy.length)}
              detalle="Pendientes para hoy"
              color="cyan"
            />

            <Indicador
              href="/cobros"
              icono="💰"
              titulo="Cobros hoy"
              valor={cargando ? "..." : String(resumen.cobrosHoy.length)}
              detalle="Programados para hoy"
              color="emerald"
            />

            <Indicador
              href="/visitas"
              icono="👤"
              titulo="Visitas hoy"
              valor={cargando ? "..." : String(resumen.visitasHoy.length)}
              detalle="Agenda del día"
              color="amber"
            />

            <Indicador
              href="/reportes"
              icono="⚠️"
              titulo="Vencidos"
              valor={cargando ? "..." : String(resumen.vencidos)}
              detalle="Tareas atrasadas"
              color="rose"
            />
          </section>

          {!cargando && resumen.cobrosHoy.length > 0 && (
            <Link
              href="/cobros"
              className="mb-6 block rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-5 transition hover:border-emerald-300 hover:bg-emerald-500/15"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                    Cobros para hoy
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {resumen.cobrosHoy.length === 1
                      ? "Tenés 1 cobro programado"
                      : `Tenés ${resumen.cobrosHoy.length} cobros programados`}
                  </h2>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {resumen.cobrosHoy.slice(0, 6).map((cobro) => (
                      <div
                        key={cobro.id}
                        className="rounded-2xl border border-emerald-400/20 bg-slate-950/60 px-4 py-3"
                      >
                        <p className="truncate font-bold">
                          {cobro.cliente || "Cliente sin nombre"}
                        </p>

                        <p className="mt-1 text-sm text-emerald-200">
                          {formatearDinero(
                            Number(cobro.monto || 0),
                            cobro.moneda || "UYU"
                          )}
                        </p>

                        {cobro.factura && (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            Factura {cobro.factura}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-w-56 rounded-2xl border border-emerald-400/20 bg-slate-950/60 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Total para hoy
                  </p>

                  {resumen.totalCobrosUYU > 0 && (
                    <p className="mt-2 text-xl font-black text-emerald-300">
                      {formatearDinero(resumen.totalCobrosUYU, "UYU")}
                    </p>
                  )}

                  {resumen.totalCobrosUSD > 0 && (
                    <p className="mt-1 text-xl font-black text-emerald-300">
                      {formatearDinero(resumen.totalCobrosUSD, "USD")}
                    </p>
                  )}

                  <p className="mt-3 text-sm font-bold">
                    Abrir cobros →
                  </p>
                </div>
              </div>
            </Link>
          )}

          {!cargando && resumen.entregasHoy.length > 0 && (
            <Alerta
              href="/entregas"
              icono="🚚"
              titulo={`${resumen.entregasHoy.length} ${
                resumen.entregasHoy.length === 1 ? "entrega" : "entregas"
              } para hoy`}
              detalle={resumen.entregasHoy
                .slice(0, 4)
                .map((item) => item.cliente)
                .filter(Boolean)
                .join(" · ")}
              color="cyan"
            />
          )}

          {!cargando && resumen.visitasHoy.length > 0 && (
            <Alerta
              href="/visitas"
              icono="👤"
              titulo={`${resumen.visitasHoy.length} ${
                resumen.visitasHoy.length === 1 ? "visita" : "visitas"
              } para hoy`}
              detalle={resumen.visitasHoy
                .slice(0, 4)
                .map((item) => item.cliente)
                .filter(Boolean)
                .join(" · ")}
              color="amber"
            />
          )}

          {!cargando && resumen.vencidos > 0 && (
            <div className="mb-8 rounded-3xl border border-red-500/40 bg-red-500/10 p-5">
              <div className="flex items-start gap-4">
                <div className="text-3xl">⚠️</div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
                    Atención
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Tenés {resumen.vencidos} tareas vencidas
                  </h2>

                  <p className="mt-2 text-sm text-red-100/80">
                    {resumen.entregasVencidas.length} entregas ·{" "}
                    {resumen.cobrosVencidos.length} cobros ·{" "}
                    {resumen.visitasVencidas.length} visitas
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Modulo
              href="/entregas"
              icono="🚚"
              titulo="Entregas"
              descripcion="Depósito, reparto, etiquetas, QR e historial."
              color="cyan"
            />

            <Modulo
              href="/cobros"
              icono="💰"
              titulo="Cobros"
              descripcion="Cobros pendientes, completados y reprogramados."
              color="emerald"
            />

            <Modulo
              href="/visitas"
              icono="👤"
              titulo="Visitas"
              descripcion="Agenda comercial, clientes y seguimientos."
              color="amber"
            />

            <Modulo
              href="/rutas"
              icono="🗺️"
              titulo="Ruta del día"
              descripcion="Organizar tareas y abrir el recorrido en Google Maps."
              color="violet"
            />

            <Modulo
              href="/clientes"
              icono="👥"
              titulo="Clientes"
              descripcion="Base compartida de clientes, teléfonos y direcciones."
              color="blue"
            />

            <Modulo
              href="/reportes"
              icono="📊"
              titulo="Reportes"
              descripcion="Resultados de entregas, cobros y visitas."
              color="rose"
            />
          </div>
        </div>
      </main>
    </LayoutOperaciones>
  );
}

function Indicador({
  href,
  icono,
  titulo,
  valor,
  detalle,
  color,
}: {
  href: string;
  icono: string;
  titulo: string;
  valor: string;
  detalle: string;
  color: "cyan" | "emerald" | "amber" | "rose";
}) {
  const estilos = {
    cyan: "border-cyan-500/30 hover:border-cyan-400",
    emerald: "border-emerald-500/30 hover:border-emerald-400",
    amber: "border-amber-500/30 hover:border-amber-400",
    rose: "border-rose-500/30 hover:border-rose-400",
  };

  return (
    <Link href={href}>
      <Card
        className={`h-full border transition hover:-translate-y-1 ${estilos[color]}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              {titulo}
            </p>

            <div className="mt-3 text-4xl font-black">{valor}</div>

            <p className="mt-2 text-sm text-slate-400">{detalle}</p>
          </div>

          <div className="text-3xl">{icono}</div>
        </div>
      </Card>
    </Link>
  );
}

function Alerta({
  href,
  icono,
  titulo,
  detalle,
  color,
}: {
  href: string;
  icono: string;
  titulo: string;
  detalle: string;
  color: "cyan" | "amber";
}) {
  const estilos = {
    cyan: "border-cyan-500/40 bg-cyan-500/10 hover:border-cyan-300",
    amber: "border-amber-500/40 bg-amber-500/10 hover:border-amber-300",
  };

  return (
    <Link
      href={href}
      className={`mb-4 block rounded-3xl border p-5 transition ${estilos[color]}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icono}</div>

        <div>
          <h2 className="text-xl font-black">{titulo}</h2>

          {detalle && (
            <p className="mt-2 text-sm text-slate-300">{detalle}</p>
          )}

          <p className="mt-3 text-sm font-bold">Abrir módulo →</p>
        </div>
      </div>
    </Link>
  );
}

function Modulo({
  href,
  icono,
  titulo,
  descripcion,
  color,
}: {
  href: string;
  icono: string;
  titulo: string;
  descripcion: string;
  color: "cyan" | "emerald" | "amber" | "violet" | "blue" | "rose";
}) {
  const estilos = {
    cyan: "border-cyan-500/30 hover:border-cyan-400",
    emerald: "border-emerald-500/30 hover:border-emerald-400",
    amber: "border-amber-500/30 hover:border-amber-400",
    violet: "border-violet-500/30 hover:border-violet-400",
    blue: "border-blue-500/30 hover:border-blue-400",
    rose: "border-rose-500/30 hover:border-rose-400",
  };

  return (
    <Link
      href={href}
      className={`group rounded-3xl border bg-slate-900 p-4 shadow-xl transition duration-200 hover:-translate-y-1 hover:bg-slate-800 ${estilos[color]}`}
    >
      <div className="text-4xl">{icono}</div>

      <h2 className="mt-5 text-2xl font-black">{titulo}</h2>

      <p className="mt-2 min-h-10 text-sm leading-6 text-slate-400">
        {descripcion}
      </p>

      <div className="mt-6 text-sm font-bold text-white">
        Abrir módulo →
      </div>
    </Link>
  );
}

function obtenerFecha(
  item: Registro,
  campos: string[]
): string {
  for (const campo of campos) {
    const valor = item[campo];

    if (typeof valor === "string" && valor.length >= 10) {
      return valor.slice(0, 10);
    }
  }

  return "";
}

function fechaLocalISO() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearDinero(
  valor: number,
  moneda: "UYU" | "USD"
) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
}
