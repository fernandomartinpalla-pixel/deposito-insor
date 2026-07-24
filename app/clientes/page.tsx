"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import LayoutOperaciones from "@/components/LayoutOperaciones";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";

import type { Cliente } from "@/types/cliente";
import { cargarClientes as cargarClientesDB } from "@/lib/clientes";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    try {
      setCargando(true);
      setMensaje("");

      const data = await cargarClientesDB();
      setClientes(data);
    } catch (error: any) {
      setMensaje(error.message || "No se pudieron cargar los clientes.");
    } finally {
      setCargando(false);
    }
  }

  function abrirGoogleMaps(cliente: Cliente) {
    const destino = [
      cliente.direccion,
      cliente.departamento,
      "Uruguay",
    ]
      .filter(Boolean)
      .join(", ");

    if (!destino.trim()) {
      setMensaje("Este cliente no tiene una dirección cargada.");
      return;
    }

    const url =
      "https://www.google.com/maps/dir/?api=1" +
      `&destination=${encodeURIComponent(destino)}` +
      "&travelmode=driving";

    window.open(url, "_blank", "noopener,noreferrer");
  }

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return clientes;

    return clientes.filter((cliente) => {
      return (
        cliente.nombre?.toLowerCase().includes(texto) ||
        cliente.telefono?.toLowerCase().includes(texto) ||
        cliente.direccion?.toLowerCase().includes(texto) ||
        cliente.departamento?.toLowerCase().includes(texto)
      );
    });
  }, [clientes, busqueda]);

  return (
    <LayoutOperaciones titulo="Clientes">
      <main className="p-3 sm:p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <PageHeader
            etiqueta="INSOR OPERACIONES"
            titulo="Clientes"
            descripcion="Consultá teléfonos, direcciones y accesos rápidos a entregas, cobros y visitas."
          />

          {mensaje && (
            <div className="mb-6 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-4 text-cyan-100">
              {mensaje}
            </div>
          )}

          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <Resumen
              titulo="Clientes"
              valor={String(clientes.length)}
              detalle="Total cargados"
            />

            <Resumen
              titulo="Con dirección"
              valor={String(
                clientes.filter((cliente) => cliente.direccion).length
              )}
              detalle="Listos para navegar"
            />

            <Resumen
              titulo="Con teléfono"
              valor={String(
                clientes.filter((cliente) => cliente.telefono).length
              )}
              detalle="Con contacto cargado"
            />
          </section>

          <div className="mb-6">
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar cliente, teléfono, dirección o departamento..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-white outline-none transition focus:border-cyan-500"
            />
          </div>

          {cargando ? (
            <Card>
              <p className="py-8 text-center text-slate-400">
                Cargando clientes...
              </p>
            </Card>
          ) : clientesFiltrados.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <div className="text-5xl">👥</div>

                <h2 className="mt-4 text-1g font-black text-white">
                  No hay clientes para mostrar
                </h2>

                <p className="mt-2 text-slate-400">
                  Probá cambiar la búsqueda.
                </p>
              </div>
            </Card>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {clientesFiltrados.map((cliente) => (
                <TarjetaCliente
                  key={cliente.id ?? cliente.nombre}
                  cliente={cliente}
                  onMaps={abrirGoogleMaps}
                />
              ))}
            </section>
          )}
        </div>
      </main>
    </LayoutOperaciones>
  );
}

function TarjetaCliente({
  cliente,
  onMaps,
}: {
  cliente: Cliente;
  onMaps: (cliente: Cliente) => void;
}) {
  const telefonoLimpio = (cliente.telefono || "").replace(/[^\d+]/g, "");

  return (
    <Card className="transition hover:-translate-y-1 hover:border-cyan-500/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variante="cyan">Cliente</Badge>

          <h2 className="mt-4 text-2xl font-black text-white">
            {cliente.nombre}
          </h2>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-2xl">
          👤
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Dato
          titulo="Dirección"
          valor={
            [cliente.direccion, cliente.departamento]
              .filter(Boolean)
              .join(" · ") || "-"
          }
        />

        <Dato
          titulo="Teléfono"
          valor={cliente.telefono || "-"}
        />
      </div>

      <div className="mt-6 grid gap-2">
        <button
          type="button"
          onClick={() => onMaps(cliente)}
          className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 font-bold text-white transition hover:border-cyan-500 hover:bg-slate-700"
        >
          🗺️ Abrir en Google Maps
        </button>

        {telefonoLimpio && (
          <a
            href={`tel:${telefonoLimpio}`}
            className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-center font-bold text-white transition hover:border-emerald-500 hover:bg-slate-700"
          >
            📞 Llamar
          </a>
        )}

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Link
            href={`/entregas?cliente=${encodeURIComponent(cliente.nombre)}`}
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-3 text-center text-xs font-black text-cyan-200 transition hover:bg-cyan-500/20"
          >
            🚚 Entrega
          </Link>

          <Link
            href={`/cobros?cliente=${encodeURIComponent(cliente.nombre)}`}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-center text-xs font-black text-emerald-200 transition hover:bg-emerald-500/20"
          >
            💰 Cobro
          </Link>

          <Link
            href={`/visitas?cliente=${encodeURIComponent(cliente.nombre)}`}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-center text-xs font-black text-amber-200 transition hover:bg-amber-500/20"
          >
            👤 Visita
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Resumen({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: string;
  detalle: string;
}) {
  return (
    <Card>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {titulo}
      </p>

      <div className="mt-3 text-3xl font-black text-white">
        {valor}
      </div>

      <p className="mt-2 text-sm text-slate-400">
        {detalle}
      </p>
    </Card>
  );
}

function Dato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 font-semibold text-slate-200">
        {valor}
      </p>
    </div>
  );
}