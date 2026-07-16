"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cargarCobros } from "@/lib/cobros";
import {
  cargarPedidosEnReparto,
  cargarPedidosProntosDeposito,
} from "@/lib/entregas";
import { cargarVisitas } from "@/lib/visitas";

type Props = {
  children: ReactNode;
  titulo?: string;
};

type Registro = Record<string, any>;

type Notificacion = {
  id: string;
  href: string;
  icono: string;
  titulo: string;
  detalle: string;
  vencida?: boolean;
};

const opciones = [
  { href: "/", icono: "🏠", titulo: "Dashboard" },
  { href: "/entregas", icono: "🚚", titulo: "Entregas" },
  { href: "/cobros", icono: "💰", titulo: "Cobros" },
  { href: "/visitas", icono: "👤", titulo: "Visitas" },
  { href: "/rutas", icono: "🗺️", titulo: "Ruta del día" },
  { href: "/clientes", icono: "👥", titulo: "Clientes" },
  { href: "/reportes", icono: "📊", titulo: "Reportes" },
];

export default function LayoutOperaciones({
  children,
  titulo = "Centro de operaciones",
}: Props) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(true);
  const [entregas, setEntregas] = useState<Registro[]>([]);
  const [cobros, setCobros] = useState<Registro[]>([]);
  const [visitas, setVisitas] = useState<Registro[]>([]);

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  useEffect(() => {
    function cerrarAlTocarAfuera(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setPanelAbierto(false);
      }
    }

    document.addEventListener("mousedown", cerrarAlTocarAfuera);

    return () => {
      document.removeEventListener("mousedown", cerrarAlTocarAfuera);
    };
  }, []);

  useEffect(() => {
    setPanelAbierto(false);
  }, [pathname]);

  async function cargarNotificaciones() {
    try {
      setCargandoNotificaciones(true);

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
      console.error("No se pudieron cargar las notificaciones:", error);
    } finally {
      setCargandoNotificaciones(false);
    }
  }

  const hoy = fechaLocalISO();

  const notificaciones = useMemo<Notificacion[]>(() => {
    const lista: Notificacion[] = [];

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

    if (cobrosHoy.length > 0) {
      lista.push({
        id: "cobros-hoy",
        href: "/cobros",
        icono: "💰",
        titulo:
          cobrosHoy.length === 1
            ? "Tenés 1 cobro para hoy"
            : `Tenés ${cobrosHoy.length} cobros para hoy`,
        detalle: resumenClientes(cobrosHoy),
      });
    }

    if (entregasHoy.length > 0) {
      lista.push({
        id: "entregas-hoy",
        href: "/entregas",
        icono: "🚚",
        titulo:
          entregasHoy.length === 1
            ? "Tenés 1 entrega para hoy"
            : `Tenés ${entregasHoy.length} entregas para hoy`,
        detalle: resumenClientes(entregasHoy),
      });
    }

    if (visitasHoy.length > 0) {
      lista.push({
        id: "visitas-hoy",
        href: "/visitas",
        icono: "👤",
        titulo:
          visitasHoy.length === 1
            ? "Tenés 1 visita para hoy"
            : `Tenés ${visitasHoy.length} visitas para hoy`,
        detalle: resumenClientes(visitasHoy),
      });
    }

    if (cobrosVencidos.length > 0) {
      lista.push({
        id: "cobros-vencidos",
        href: "/cobros",
        icono: "⚠️",
        titulo:
          cobrosVencidos.length === 1
            ? "Hay 1 cobro vencido"
            : `Hay ${cobrosVencidos.length} cobros vencidos`,
        detalle: resumenClientes(cobrosVencidos),
        vencida: true,
      });
    }

    if (entregasVencidas.length > 0) {
      lista.push({
        id: "entregas-vencidas",
        href: "/entregas",
        icono: "⚠️",
        titulo:
          entregasVencidas.length === 1
            ? "Hay 1 entrega vencida"
            : `Hay ${entregasVencidas.length} entregas vencidas`,
        detalle: resumenClientes(entregasVencidas),
        vencida: true,
      });
    }

    if (visitasVencidas.length > 0) {
      lista.push({
        id: "visitas-vencidas",
        href: "/visitas",
        icono: "⚠️",
        titulo:
          visitasVencidas.length === 1
            ? "Hay 1 visita vencida"
            : `Hay ${visitasVencidas.length} visitas vencidas`,
        detalle: resumenClientes(visitasVencidas),
        vencida: true,
      });
    }

    return lista;
  }, [entregas, cobros, visitas, hoy]);

  function estaActiva(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-[#070b1b] lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-7 py-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-lg font-black text-slate-950">
                I
              </div>

              <div>
                <p className="text-lg font-black tracking-wide">INSOR</p>
                <p className="text-sm text-slate-400">Operaciones</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {opciones.map((opcion) => {
              const activa = estaActiva(opcion.href);

              return (
                <Link
                  key={opcion.href}
                  href={opcion.href}
                  className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 font-bold transition ${
                    activa
                      ? "border-cyan-400 bg-cyan-500/15 text-cyan-100"
                      : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg">
                    {opcion.icono}
                  </span>

                  <span>{opcion.titulo}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm font-bold text-white">
                INSOR Internacional
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Centro operativo empresarial
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#050816]/95 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
                  INSOR OPERACIONES
                </p>

                <h1 className="mt-1 text-lg font-black text-white">
                  {titulo}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-400 md:block">
                  Centro de operaciones
                </div>

                <div ref={panelRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setPanelAbierto((actual) => !actual)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-lg transition hover:border-cyan-400 hover:bg-slate-800"
                    aria-label="Abrir notificaciones"
                  >
                    🔔

                    {!cargandoNotificaciones &&
                      notificaciones.length > 0 && (
                        <span className="absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#050816] bg-red-500 px-1 text-xs font-black text-white">
                          {notificaciones.length > 9
                            ? "9+"
                            : notificaciones.length}
                        </span>
                      )}
                  </button>

                  {panelAbierto && (
                    <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-3xl border border-slate-700 bg-[#080d20] shadow-2xl shadow-black/50">
                      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                            Notificaciones
                          </p>

                          <h2 className="mt-1 text-lg font-black">
                            Actividad importante
                          </h2>
                        </div>

                        <button
                          type="button"
                          onClick={cargarNotificaciones}
                          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-300 hover:border-cyan-400 hover:text-white"
                        >
                          ↻
                        </button>
                      </div>

                      <div className="max-h-[65vh] overflow-y-auto p-3">
                        {cargandoNotificaciones ? (
                          <div className="px-3 py-10 text-center text-sm text-slate-400">
                            Cargando notificaciones...
                          </div>
                        ) : notificaciones.length === 0 ? (
                          <div className="px-3 py-10 text-center">
                            <div className="text-4xl">✅</div>
                            <p className="mt-3 font-black">
                              No hay alertas pendientes
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              Está todo al día.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {notificaciones.map((notificacion) => (
                              <Link
                                key={notificacion.id}
                                href={notificacion.href}
                                className={`block rounded-2xl border p-4 transition ${
                                  notificacion.vencida
                                    ? "border-red-500/30 bg-red-500/10 hover:border-red-400"
                                    : "border-slate-700 bg-slate-900 hover:border-cyan-400"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">
                                    {notificacion.icono}
                                  </span>

                                  <div className="min-w-0">
                                    <p className="font-black text-white">
                                      {notificacion.titulo}
                                    </p>

                                    {notificacion.detalle && (
                                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                                        {notificacion.detalle}
                                      </p>
                                    )}

                                    <p className="mt-2 text-xs font-bold text-cyan-300">
                                      Abrir módulo →
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-800 p-3">
                        <Link
                          href="/"
                          className="block rounded-2xl bg-cyan-500 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-400"
                        >
                          Ver Dashboard
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto border-t border-slate-800 px-4 py-3 lg:hidden">
              {opciones.map((opcion) => {
                const activa = estaActiva(opcion.href);

                return (
                  <Link
                    key={opcion.href}
                    href={opcion.href}
                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
                      activa
                        ? "border-cyan-400 bg-cyan-500 text-slate-950"
                        : "border-slate-700 bg-slate-900 text-slate-300"
                    }`}
                  >
                    <span>{opcion.icono}</span>
                    <span>{opcion.titulo}</span>
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
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

function resumenClientes(items: Registro[]) {
  const nombres = items
    .map((item) => item.cliente)
    .filter(Boolean)
    .slice(0, 4);

  const texto = nombres.join(" · ");

  if (items.length > 4) {
    return `${texto} · y ${items.length - 4} más`;
  }

  return texto;
}