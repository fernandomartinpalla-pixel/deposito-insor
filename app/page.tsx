"use client";

import Link from "next/link";
import LayoutOperaciones from "@/components/LayoutOperaciones";
export default function Home() {
  return (
    <LayoutOperaciones titulo="Dashboard">
  <main className="p-3 sm:p-4 lg:p-8">
    <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            INSOR OPERACIONES
          </p>

          <h1 className="mt-3 text-4xl font-black lg:text-6xl">
            Centro de operaciones
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Entregas, cobros, visitas comerciales y rutas desde un solo lugar.
          </p>
        </div>

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