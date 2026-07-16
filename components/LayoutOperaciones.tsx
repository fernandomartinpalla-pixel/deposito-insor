"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
  titulo?: string;
};

const opciones = [
  {
    href: "/",
    icono: "🏠",
    titulo: "Dashboard",
  },
  {
    href: "/entregas",
    icono: "🚚",
    titulo: "Entregas",
  },
  {
    href: "/cobros",
    icono: "💰",
    titulo: "Cobros",
  },
  {
    href: "/visitas",
    icono: "👤",
    titulo: "Visitas",
  },
  {
    href: "/rutas",
    icono: "🗺️",
    titulo: "Ruta del día",
  },
  {
    href: "/clientes",
    icono: "👥",
    titulo: "Clientes",
  },
  {
    href: "/reportes",
    icono: "📊",
    titulo: "Reportes",
  },
];

export default function LayoutOperaciones({
  children,
  titulo = "Centro de operaciones",
}: Props) {
  const pathname = usePathname();

  function estaActiva(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex min-h-screen">
        {/* MENÚ LATERAL DE ESCRITORIO */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-[#070b1b] lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-7 py-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-1g font-black text-slate-950">
                I
              </div>

              <div>
                <p className="text-1g font-black tracking-wide">INSOR</p>

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

        {/* CONTENIDO */}
        <div className="min-w-0 flex-1">
          {/* BARRA SUPERIOR */}
          <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#050816]/95 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
                  INSOR OPERACIONES
                </p>

                <h1 className="mt-1 text-lg font-black text-white lg:text-1g">
                  {titulo}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-400 md:block">
                  Centro de operaciones
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-lg">
                  🔔
                </div>
              </div>
            </div>

            {/* MENÚ MÓVIL */}
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