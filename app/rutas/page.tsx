"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import LayoutOperaciones from "@/components/LayoutOperaciones";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

import type { Entrega } from "@/types/entrega";
import type { Cobro } from "@/types/cobro";
import type { Visita } from "@/types/visita";

import { cargarPedidosEnReparto } from "@/lib/entregas";
import { cargarCobros } from "@/lib/cobros";
import { cargarVisitas } from "@/lib/visitas";

type TipoTarea = "entrega" | "cobro" | "visita";

type TareaRuta = {
  clave: string;
  id: number;
  tipo: TipoTarea;
  cliente: string;
  direccion: string;
  departamento: string;
  telefono: string;
  fecha: string;
  hora: string;
  detalle: string;
  observaciones: string;
};

const ORIGEN_INSOR = "Av. General Flores 3289, Montevideo, Uruguay";

export default function RutaDelDiaPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setMensaje("");

      const [listaEntregas, listaCobros, listaVisitas] = await Promise.all([
        cargarPedidosEnReparto(),
        cargarCobros(),
        cargarVisitas(),
      ]);

      setEntregas(listaEntregas);
      setCobros(listaCobros);
      setVisitas(listaVisitas);
    } catch (error: any) {
      setMensaje(error.message || "No se pudo cargar la ruta del día.");
    } finally {
      setCargando(false);
    }
  }

  const tareas = useMemo<TareaRuta[]>(() => {
    const tareasEntregas: TareaRuta[] = entregas.map((entrega) => ({
      clave: `entrega-${entrega.id}`,
      id: entrega.id,
      tipo: "entrega",
      cliente: entrega.cliente || "Cliente sin nombre",
      direccion: entrega.direccion || "",
      departamento: entrega.departamento || "",
      telefono: entrega.telefono_cliente || "",
      fecha: (entrega.fecha_entrega_programada || "").slice(0, 10),
      hora: "",
      detalle: entrega.numero_factura
        ? `Factura ${entrega.numero_factura}`
        : "Entrega",
      observaciones: entrega.observaciones || "",
    }));

    const tareasCobros: TareaRuta[] = cobros
      .filter((cobro) => cobro.estado === "pendiente")
      .map((cobro) => ({
        clave: `cobro-${cobro.id}`,
        id: cobro.id,
        tipo: "cobro",
        cliente: cobro.cliente || "Cliente sin nombre",
        direccion: cobro.direccion || "",
        departamento: cobro.departamento || "",
        telefono: cobro.telefono || "",
        fecha: (cobro.fecha_programada || "").slice(0, 10),
        hora: "",
        detalle: `${cobro.moneda} ${Number(cobro.monto || 0).toLocaleString("es-UY")}${
          cobro.factura ? ` · ${cobro.factura}` : ""
        }`,
        observaciones: cobro.observaciones || "",
      }));

    const tareasVisitas: TareaRuta[] = visitas
      .filter((visita) => visita.estado === "pendiente")
      .map((visita) => ({
        clave: `visita-${visita.id}`,
        id: visita.id,
        tipo: "visita",
        cliente: visita.cliente || "Cliente sin nombre",
        direccion: visita.direccion || "",
        departamento: visita.departamento || "",
        telefono: visita.telefono || "",
        fecha: (visita.fecha_programada || "").slice(0, 10),
        hora: visita.hora_programada?.slice(0, 5) || "",
        detalle: visita.motivo || "Visita comercial",
        observaciones: visita.observaciones || "",
      }));

    return [...tareasEntregas, ...tareasCobros, ...tareasVisitas].sort((a, b) => {
      const fechaA = `${a.fecha || "9999-12-31"}T${a.hora || "23:59"}`;
      const fechaB = `${b.fecha || "9999-12-31"}T${b.hora || "23:59"}`;
      return fechaA.localeCompare(fechaB);
    });
  }, [entregas, cobros, visitas]);

  const tareasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return tareas.filter((tarea) => {
      const coincideFecha = tarea.fecha === fechaSeleccionada;
      const coincideTexto =
        !texto ||
        tarea.cliente.toLowerCase().includes(texto) ||
        tarea.direccion.toLowerCase().includes(texto) ||
        tarea.departamento.toLowerCase().includes(texto) ||
        tarea.detalle.toLowerCase().includes(texto);

      return coincideFecha && coincideTexto;
    });
  }, [tareas, fechaSeleccionada, busqueda]);

  const tareasElegidas = useMemo(
    () => tareasFiltradas.filter((tarea) => seleccionadas.includes(tarea.clave)),
    [tareasFiltradas, seleccionadas]
  );

  const resumen = useMemo(
    () => ({
      total: tareasFiltradas.length,
      entregas: tareasFiltradas.filter((t) => t.tipo === "entrega").length,
      cobros: tareasFiltradas.filter((t) => t.tipo === "cobro").length,
      visitas: tareasFiltradas.filter((t) => t.tipo === "visita").length,
    }),
    [tareasFiltradas]
  );

  function toggleSeleccion(clave: string) {
    setSeleccionadas((actuales) =>
      actuales.includes(clave)
        ? actuales.filter((item) => item !== clave)
        : [...actuales, clave]
    );
  }

  function direccionCompleta(tarea: TareaRuta) {
    return [tarea.direccion, tarea.departamento, "Uruguay"]
      .filter(Boolean)
      .join(", ");
  }

  function abrirTareaEnMaps(tarea: TareaRuta) {
    if (!tarea.direccion.trim()) {
      setMensaje(`El cliente ${tarea.cliente} no tiene dirección cargada.`);
      return;
    }

    const url =
      "https://www.google.com/maps/dir/?api=1" +
      `&origin=${encodeURIComponent(ORIGEN_INSOR)}` +
      `&destination=${encodeURIComponent(direccionCompleta(tarea))}` +
      "&travelmode=driving";

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function abrirRutaCompleta() {
    if (tareasElegidas.length === 0) {
      setMensaje("Seleccioná al menos una parada.");
      return;
    }

    const sinDireccion = tareasElegidas.find((tarea) => !tarea.direccion.trim());
    if (sinDireccion) {
      setMensaje(`El cliente ${sinDireccion.cliente} no tiene dirección cargada.`);
      return;
    }

    const destinos = tareasElegidas.map(direccionCompleta);
    const waypoints = destinos.map(encodeURIComponent).join("|");

    const url =
      "https://www.google.com/maps/dir/?api=1" +
      `&origin=${encodeURIComponent(ORIGEN_INSOR)}` +
      `&destination=${encodeURIComponent(ORIGEN_INSOR)}` +
      `&waypoints=${waypoints}` +
      "&travelmode=driving";

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function enlaceModulo(tarea: TareaRuta) {
    if (tarea.tipo === "entrega") return "/entregas";
    if (tarea.tipo === "cobro") return "/cobros";
    return "/visitas";
  }

  return (
    <LayoutOperaciones titulo="Ruta del día">
      <main className="p-3 sm:p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <PageHeader
            etiqueta="INSOR OPERACIONES"
            titulo="Ruta del día"
            descripcion="Seleccioná entregas, cobros y visitas para abrir el recorrido completo en Google Maps."
            acciones={
              <Button onClick={cargarDatos} variante="secondary">
                Actualizar
              </Button>
            }
          />

          {mensaje && (
            <div className="mb-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-cyan-100">
              {mensaje}
            </div>
          )}

          <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Resumen titulo="Total" valor={resumen.total} icono="🧭" />
            <Resumen titulo="Entregas" valor={resumen.entregas} icono="🚚" />
            <Resumen titulo="Cobros" valor={resumen.cobros} icono="💰" />
            <Resumen titulo="Visitas" valor={resumen.visitas} icono="👤" />
          </section>

          <Card className="mb-6">
            <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-300">Fecha</span>
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(event) => {
                    setFechaSeleccionada(event.target.value);
                    setSeleccionadas([]);
                  }}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-300">Buscar</span>
                <input
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Cliente, dirección o detalle..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variante="secondary"
                  onClick={() => setSeleccionadas(tareasFiltradas.map((t) => t.clave))}
                >
                  Seleccionar todo
                </Button>
                <Button variante="secondary" onClick={() => setSeleccionadas([])}>
                  Limpiar
                </Button>
              </div>
            </div>
          </Card>

          <div className="sticky top-24 z-30 mb-6 rounded-3xl border border-cyan-500/40 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                  Ruta seleccionada
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {tareasElegidas.length} parada{tareasElegidas.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Sale y vuelve a Av. General Flores 3289.
                </p>
              </div>

              <Button
                anchoCompleto
                onClick={abrirRutaCompleta}
                disabled={tareasElegidas.length === 0}
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 lg:w-auto"
              >
                🗺️ Abrir ruta completa
              </Button>
            </div>
          </div>

          {cargando ? (
            <Card>
              <p className="py-10 text-center text-slate-400">Cargando agenda...</p>
            </Card>
          ) : tareasFiltradas.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <div className="text-5xl">🗺️</div>
                <h2 className="mt-4 text-1g font-black text-white">
                  No hay tareas para esta fecha
                </h2>
                <p className="mt-2 text-slate-400">
                  Cambiá la fecha o revisá Entregas, Cobros y Visitas.
                </p>
              </div>
            </Card>
          ) : (
            <section className="grid gap-4 lg:grid-cols-2">
              {tareasFiltradas.map((tarea, index) => (
                <TarjetaTarea
                  key={tarea.clave}
                  tarea={tarea}
                  numero={index + 1}
                  seleccionada={seleccionadas.includes(tarea.clave)}
                  onSeleccionar={() => toggleSeleccion(tarea.clave)}
                  onMaps={() => abrirTareaEnMaps(tarea)}
                  enlace={enlaceModulo(tarea)}
                />
              ))}
            </section>
          )}
        </div>
      </main>
    </LayoutOperaciones>
  );
}

function TarjetaTarea({
  tarea,
  numero,
  seleccionada,
  onSeleccionar,
  onMaps,
  enlace,
}: {
  tarea: TareaRuta;
  numero: number;
  seleccionada: boolean;
  onSeleccionar: () => void;
  onMaps: () => void;
  enlace: string;
}) {
  const telefonoLimpio = tarea.telefono.replace(/[^\d+]/g, "");

  return (
    <Card
      className={`transition ${
        seleccionada
          ? "border-cyan-400 bg-cyan-500/10"
          : "hover:border-slate-600"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSeleccionar}
          className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm font-black ${
            seleccionada
              ? "border-cyan-400 bg-cyan-500 text-slate-950"
              : "border-slate-600 bg-slate-900 text-transparent"
          }`}
          aria-label="Seleccionar parada"
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-slate-500">#{numero}</span>
            <TipoBadge tipo={tarea.tipo} />
            {tarea.hora && <Badge variante="slate">{tarea.hora}</Badge>}
          </div>

          <h2 className="mt-3 break-words text-1g font-black text-white">
            {tarea.cliente}
          </h2>

          <p className="mt-2 text-sm font-semibold text-slate-300">
            {tarea.detalle}
          </p>

          <p className="mt-3 text-sm text-slate-400">
            📍 {[tarea.direccion, tarea.departamento].filter(Boolean).join(" · ") || "Sin dirección"}
          </p>

          {tarea.telefono && (
            <p className="mt-2 text-sm text-slate-400">☎ {tarea.telefono}</p>
          )}

          {tarea.observaciones && (
            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">
              {tarea.observaciones}
            </div>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button variante="secondary" onClick={onMaps}>
              📍 Maps
            </Button>

            {telefonoLimpio ? (
              <a
                href={`tel:${telefonoLimpio}`}
                className="flex min-h-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 font-bold text-white transition hover:border-emerald-500 hover:bg-slate-700"
              >
                ☎ Llamar
              </a>
            ) : (
              <button
                disabled
                className="min-h-10 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 font-bold text-slate-600"
              >
                Sin teléfono
              </button>
            )}

            <Link
              href={enlace}
              className="flex min-h-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 font-bold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Abrir módulo
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TipoBadge({ tipo }: { tipo: TipoTarea }) {
  if (tipo === "entrega") return <Badge variante="cyan">🚚 Entrega</Badge>;
  if (tipo === "cobro") return <Badge variante="green">💰 Cobro</Badge>;
  return <Badge variante="yellow">👤 Visita</Badge>;
}

function Resumen({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: number;
  icono: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {titulo}
          </p>
          <p className="mt-2 text-3xl font-black text-white">{valor}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-1g">
          {icono}
        </div>
      </div>
    </Card>
  );
}