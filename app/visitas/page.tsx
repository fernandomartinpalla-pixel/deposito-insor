"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import LayoutOperaciones from "@/components/LayoutOperaciones";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

import type { Cliente } from "@/types/cliente";
import type {
  EstadoVisita,
  PrioridadVisita,
  Visita,
} from "@/types/visita";

import { cargarClientes as cargarClientesDB } from "@/lib/clientes";

import {
  cargarVisitas,
  guardarVisita,
  cambiarEstadoVisita,
  eliminarVisita,
} from "@/lib/visitas";

type FiltroVisita =
  | "pendientes"
  | "realizadas"
  | "reprogramadas"
  | "todas";

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [filtro, setFiltro] = useState<FiltroVisita>("pendientes");
  const [busqueda, setBusqueda] = useState("");

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [telefono, setTelefono] = useState("");
const [visitaAccion, setVisitaAccion] = useState<Visita | null>(null);
const [estadoAccion, setEstadoAccion] = useState<EstadoVisita | null>(null);
const [resultadoAccion, setResultadoAccion] = useState("");
const [proximaVisitaAccion, setProximaVisitaAccion] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [horaProgramada, setHoraProgramada] = useState("");
  const [motivo, setMotivo] = useState("");
  const [prioridad, setPrioridad] =
    useState<PrioridadVisita>("normal");
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);




  async function cargarDatos() {
    try {
      setCargando(true);
      setMensaje("");

      const [listaVisitas, listaClientes] = await Promise.all([
        cargarVisitas(),
        cargarClientesDB(),
      ]);

      setVisitas(listaVisitas);
      setClientes(listaClientes);
    } catch (error: any) {
      setMensaje(error.message || "No se pudieron cargar las visitas.");
    } finally {
      setCargando(false);
    }
  }

  function cambiarCliente(valor: string) {
    setCliente(valor);

    const encontrado = clientes.find(
      (item) =>
        item.nombre.trim().toLowerCase() ===
        valor.trim().toLowerCase()
    );

    if (!encontrado) {
      setClienteId(null);
      return;
    }

    setClienteId(encontrado.id ?? null);
    setDireccion(encontrado.direccion || "");
    setDepartamento(encontrado.departamento || "");
    setTelefono(encontrado.telefono || "");
  }

  async function crearVisita() {
    setMensaje("");

    if (!cliente.trim()) {
      setMensaje("Seleccioná o escribí un cliente.");
      return;
    }

    if (!fechaProgramada) {
      setMensaje("Ingresá la fecha de la visita.");
      return;
    }

    try {
      setGuardando(true);

      await guardarVisita({
        clienteId,
        cliente,
        direccion,
        departamento,
        telefono,
        fechaProgramada,
        horaProgramada,
        motivo,
        prioridad,
        responsable,
        observaciones,
      });

      limpiarFormulario();
      setPanelAbierto(false);

      await cargarDatos();

      setMensaje("Visita agregada correctamente.");
    } catch (error: any) {
      setMensaje(error.message || "No se pudo guardar la visita.");
    } finally {
      setGuardando(false);
    }
  }

  function limpiarFormulario() {
    setClienteId(null);
    setCliente("");
    setDireccion("");
    setDepartamento("");
    setTelefono("");
    setFechaProgramada(new Date().toISOString().slice(0, 10));
    setHoraProgramada("");
    setMotivo("");
    setPrioridad("normal");
    setResponsable("");
    setObservaciones("");
  }

  function actualizarEstado(
    visita: Visita,
    estado: EstadoVisita
  ) {
    setVisitaAccion(visita);
    setEstadoAccion(estado);
    setResultadoAccion("");
    setProximaVisitaAccion("");
    setMensaje("");
  }

  function cerrarAccion() {
    setVisitaAccion(null);
    setEstadoAccion(null);
    setResultadoAccion("");
    setProximaVisitaAccion("");
  }

  async function confirmarCambioEstado() {
    if (!visitaAccion || !estadoAccion) return;

    if (
      estadoAccion === "reprogramada" &&
      !proximaVisitaAccion
    ) {
      setMensaje("Indicá la nueva fecha de la visita.");
      return;
    }

    try {
      await cambiarEstadoVisita({
        id: visitaAccion.id,
        estado: estadoAccion,
        resultado:
          resultadoAccion.trim() ||
          (estadoAccion === "realizada"
            ? "Visita realizada"
            : estadoAccion === "no_encontrado"
            ? "Cliente no encontrado"
            : estadoAccion === "reprogramada"
            ? "Visita reprogramada"
            : "Visita actualizada"),
        proximaVisita:
          estadoAccion === "reprogramada"
            ? proximaVisitaAccion
            : undefined,
      });

      await cargarDatos();

      if (estadoAccion === "realizada") {
        setMensaje(`Visita a ${visitaAccion.cliente} completada.`);
      } else if (estadoAccion === "reprogramada") {
        setMensaje(`Visita a ${visitaAccion.cliente} reprogramada.`);
      } else if (estadoAccion === "no_encontrado") {
        setMensaje("La visita fue marcada como cliente no encontrado.");
      } else {
        setMensaje("Visita actualizada.");
      }

      cerrarAccion();
    } catch (error: any) {
      setMensaje(error.message || "No se pudo actualizar la visita.");
    }
  }

  async function borrarVisita(id: number) {
    const confirmar = window.confirm(
      "¿Seguro que querés eliminar esta visita?"
    );

    if (!confirmar) return;

    try {
      await eliminarVisita(id);
      await cargarDatos();
      setMensaje("Visita eliminada.");
    } catch (error: any) {
      setMensaje(error.message || "No se pudo eliminar la visita.");
    }
  }

  function abrirGoogleMaps(visita: Visita) {
    const destino = [visita.direccion, visita.departamento, "Uruguay"]
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

  const resumen = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);

    return {
      pendientes: visitas.filter(
        (visita) => visita.estado === "pendiente"
      ).length,

      hoy: visitas.filter(
        (visita) =>
          visita.fecha_programada === hoy &&
          visita.estado === "pendiente"
      ).length,

      realizadas: visitas.filter(
        (visita) => visita.estado === "realizada"
      ).length,

      reprogramadas: visitas.filter(
        (visita) => visita.estado === "reprogramada"
      ).length,
    };
  }, [visitas]);

  const visitasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return visitas.filter((visita) => {
      const coincideFiltro =
        filtro === "todas" ||
        (filtro === "pendientes" &&
          visita.estado === "pendiente") ||
        (filtro === "realizadas" &&
          visita.estado === "realizada") ||
        (filtro === "reprogramadas" &&
          visita.estado === "reprogramada");

      const coincideBusqueda =
        !texto ||
        visita.cliente.toLowerCase().includes(texto) ||
        visita.direccion?.toLowerCase().includes(texto) ||
        visita.departamento?.toLowerCase().includes(texto) ||
        visita.responsable?.toLowerCase().includes(texto) ||
        visita.motivo?.toLowerCase().includes(texto);

      return coincideFiltro && coincideBusqueda;
    });
  }, [visitas, filtro, busqueda]);

  return (
    <LayoutOperaciones titulo="Visitas comerciales">
      <main className="p-3 sm:p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <PageHeader
            etiqueta="INSOR OPERACIONES"
            titulo="Visitas comerciales"
            descripcion="Organizá la agenda del vendedor, registrá resultados y abrí la navegación hacia cada cliente."
            acciones={
              <Button onClick={() => setPanelAbierto(true)}>
                + Nueva visita
              </Button>
            }
          />

          {mensaje && (
            <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-amber-100">
              {mensaje}
            </div>
          )}

          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Resumen
              titulo="Pendientes"
              valor={String(resumen.pendientes)}
              detalle="Visitas sin completar"
            />

            <Resumen
              titulo="Para hoy"
              valor={String(resumen.hoy)}
              detalle="Agenda del día"
            />

            <Resumen
              titulo="Realizadas"
              valor={String(resumen.realizadas)}
              detalle="Visitas completadas"
            />

            <Resumen
              titulo="Reprogramadas"
              valor={String(resumen.reprogramadas)}
              detalle="Pendientes de nueva visita"
            />
          </section>

          <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Filtro
                activo={filtro === "pendientes"}
                onClick={() => setFiltro("pendientes")}
              >
                Pendientes
              </Filtro>

              <Filtro
                activo={filtro === "realizadas"}
                onClick={() => setFiltro("realizadas")}
              >
                Realizadas
              </Filtro>

              <Filtro
                activo={filtro === "reprogramadas"}
                onClick={() => setFiltro("reprogramadas")}
              >
                Reprogramadas
              </Filtro>

              <Filtro
                activo={filtro === "todas"}
                onClick={() => setFiltro("todas")}
              >
                Todas
              </Filtro>
            </div>

            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar cliente, dirección o vendedor..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 outline-none transition focus:border-amber-500 lg:w-96"
            />
          </section>

          {cargando ? (
            <Card>
              <p className="text-center text-slate-400">
                Cargando visitas...
              </p>
            </Card>
          ) : visitasFiltradas.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <div className="text-5xl">👤</div>

                <h2 className="mt-4 text-1g font-black">
                  No hay visitas para mostrar
                </h2>

                <p className="mt-2 text-slate-400">
                  Creá una visita nueva o cambiá el filtro.
                </p>
              </div>
            </Card>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visitasFiltradas.map((visita) => (
                <TarjetaVisita
                  key={visita.id}
                  visita={visita}
                  onEstado={actualizarEstado}
                  onEliminar={borrarVisita}
                  onMaps={abrirGoogleMaps}
                />
              ))}
            </section>
          )}
        </div>

        {panelAbierto && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
            <div className="mx-auto my-6 max-w-3xl">
              <Card className="border-amber-500/40">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                      Agenda comercial
                    </p>

                    <h2 className="mt-2 text-3xl font-black">
                      Nueva visita
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPanelAbierto(false);
                      limpiarFormulario();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-1g hover:bg-slate-700"
                    aria-label="Cerrar formulario"
                  >
                    ×
                  </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Campo titulo="Cliente" anchoCompleto>
                    <input
                      list="lista-clientes-visitas"
                      value={cliente}
                      onChange={(event) =>
                        cambiarCliente(event.target.value)
                      }
                      placeholder="Buscar o escribir cliente..."
                      className="input-visita"
                    />

                    <datalist id="lista-clientes-visitas">
                      {clientes.map((item) => (
                        <option
                          key={item.id ?? item.nombre}
                          value={item.nombre}
                        />
                      ))}
                    </datalist>
                  </Campo>

                  <Campo titulo="Dirección">
                    <input
                      value={direccion}
                      onChange={(event) =>
                        setDireccion(event.target.value)
                      }
                      className="input-visita"
                    />
                  </Campo>

                  <Campo titulo="Departamento">
                    <input
                      value={departamento}
                      onChange={(event) =>
                        setDepartamento(event.target.value)
                      }
                      className="input-visita"
                    />
                  </Campo>

                  <Campo titulo="Teléfono">
                    <input
                      value={telefono}
                      onChange={(event) =>
                        setTelefono(event.target.value)
                      }
                      className="input-visita"
                    />
                  </Campo>

                  <Campo titulo="Responsable">
                    <input
                      value={responsable}
                      onChange={(event) =>
                        setResponsable(event.target.value)
                      }
                      placeholder="Nombre del vendedor"
                      className="input-visita"
                    />
                  </Campo>

                  <Campo titulo="Fecha programada">
                    <input
                      type="date"
                      value={fechaProgramada}
                      onChange={(event) =>
                        setFechaProgramada(event.target.value)
                      }
                      className="input-visita"
                    />
                  </Campo>

                  <Campo titulo="Hora">
                    <input
                      type="time"
                      value={horaProgramada}
                      onChange={(event) =>
                        setHoraProgramada(event.target.value)
                      }
                      className="input-visita"
                    />
                  </Campo>

                  <Campo titulo="Prioridad">
                    <select
                      value={prioridad}
                      onChange={(event) =>
                        setPrioridad(
                          event.target.value as PrioridadVisita
                        )
                      }
                      className="input-visita"
                    >
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </Campo>

                  <Campo titulo="Motivo de la visita" anchoCompleto>
                    <input
                      value={motivo}
                      onChange={(event) =>
                        setMotivo(event.target.value)
                      }
                      placeholder="Presentación, seguimiento, toma de pedido..."
                      className="input-visita"
                    />
                  </Campo>

                  <Campo titulo="Observaciones" anchoCompleto>
                    <textarea
                      value={observaciones}
                      onChange={(event) =>
                        setObservaciones(event.target.value)
                      }
                      rows={4}
                      className="input-visita resize-none"
                    />
                  </Campo>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    variante="secondary"
                    onClick={() => {
                      setPanelAbierto(false);
                      limpiarFormulario();
                    }}
                  >
                    Cancelar
                  </Button>

                  <Button
                    disabled={guardando}
                    onClick={crearVisita}
                    className="border-amber-400 bg-amber-500 text-slate-950 hover:bg-amber-400"
                  >
                    {guardando ? "Guardando..." : "Guardar visita"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}


        {visitaAccion && estadoAccion && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-xl border-amber-500/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                    Actualizar visita
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-white">
                    {estadoAccion === "realizada"
                      ? "Completar visita"
                      : estadoAccion === "reprogramada"
                      ? "Reprogramar visita"
                      : estadoAccion === "no_encontrado"
                      ? "Cliente no encontrado"
                      : "Actualizar visita"}
                  </h2>

                  <p className="mt-2 text-slate-400">
                    Cliente: {visitaAccion.cliente}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarAccion}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-1g text-white hover:bg-slate-700"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              {estadoAccion === "reprogramada" && (
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Nueva fecha
                  </label>

                  <input
                    type="date"
                    value={proximaVisitaAccion}
                    onChange={(event) =>
                      setProximaVisitaAccion(event.target.value)
                    }
                    className="input-visita"
                  />
                </div>
              )}

              <div className="mt-6">
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Resultado u observación
                </label>

                <textarea
                  rows={5}
                  value={resultadoAccion}
                  onChange={(event) =>
                    setResultadoAccion(event.target.value)
                  }
                  className="input-visita resize-none"
                  placeholder={
                    estadoAccion === "realizada"
                      ? "Contanos qué resultado tuvo la visita..."
                      : estadoAccion === "reprogramada"
                      ? "Indicá el motivo de la reprogramación..."
                      : "Indicá qué ocurrió durante la visita..."
                  }
                />
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variante="secondary" onClick={cerrarAccion}>
                  Cancelar
                </Button>

                <Button
                  onClick={confirmarCambioEstado}
                  className="border-amber-400 bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  Confirmar
                </Button>
              </div>
            </Card>
          </div>
        )}

        <style jsx global>{`
          .input-visita {
            width: 100%;
            border: 1px solid rgb(51 65 85);
            border-radius: 1rem;
            background: rgb(2 6 23);
            padding: 0.85rem 1rem;
            color: white;
            outline: none;
            transition: border-color 150ms ease;
          }

          .input-visita:focus {
            border-color: rgb(245 158 11);
          }
        `}</style>
      </main>
    </LayoutOperaciones>
  );
}

function TarjetaVisita({
  visita,
  onEstado,
  onEliminar,
  onMaps,
}: {
  visita: Visita;
  onEstado: (visita: Visita, estado: EstadoVisita) => void;
  onEliminar: (id: number) => void;
  onMaps: (visita: Visita) => void;
}) {
  return (
    <Card className="transition hover:-translate-y-1 hover:border-amber-500/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <EstadoVisitaBadge estado={visita.estado} />
            <PrioridadBadge prioridad={visita.prioridad} />
          </div>

          <h2 className="mt-4 text-2xl font-black">
            {visita.cliente}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onEliminar(visita.id)}
          className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
        >
          Eliminar
        </button>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <Dato
          titulo="Fecha"
          valor={`${fechaUY(visita.fecha_programada)}${
            visita.hora_programada
              ? ` · ${visita.hora_programada.slice(0, 5)}`
              : ""
          }`}
        />

        <Dato
          titulo="Dirección"
          valor={
            [visita.direccion, visita.departamento]
              .filter(Boolean)
              .join(" · ") || "-"
          }
        />

        <Dato titulo="Teléfono" valor={visita.telefono || "-"} />

        <Dato
          titulo="Responsable"
          valor={visita.responsable || "-"}
        />

        <Dato titulo="Motivo" valor={visita.motivo || "-"} />
      </div>

      {visita.observaciones && (
        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
          {visita.observaciones}
        </div>
      )}

      {visita.resultado && (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-black">Resultado</p>
          <p className="mt-1">{visita.resultado}</p>
        </div>
      )}

      <div className="mt-6 grid gap-2">
        <Button
          variante="secondary"
          anchoCompleto
          onClick={() => onMaps(visita)}
        >
          🗺️ Abrir en Google Maps
        </Button>

        {visita.estado !== "realizada" && (
          <>
            <Button
              anchoCompleto
              onClick={() => onEstado(visita, "realizada")}
              className="border-amber-400 bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              ✓ Marcar realizada
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variante="secondary"
                onClick={() => onEstado(visita, "reprogramada")}
              >
                Reprogramar
              </Button>

              <Button
                variante="danger"
                onClick={() => onEstado(visita, "no_encontrado")}
              >
                No estaba
              </Button>
            </div>
          </>
        )}

        {visita.estado === "realizada" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center font-bold text-emerald-200">
            Visita completada
          </div>
        )}
      </div>
    </Card>
  );
}

function EstadoVisitaBadge({
  estado,
}: {
  estado: EstadoVisita;
}) {
  if (estado === "realizada") {
    return <Badge variante="green">Realizada</Badge>;
  }

  if (estado === "reprogramada") {
    return <Badge variante="yellow">Reprogramada</Badge>;
  }

  if (estado === "no_encontrado") {
    return <Badge variante="red">No encontrado</Badge>;
  }

  if (estado === "cancelada") {
    return <Badge variante="slate">Cancelada</Badge>;
  }

  return <Badge variante="cyan">Pendiente</Badge>;
}

function PrioridadBadge({
  prioridad,
}: {
  prioridad: PrioridadVisita;
}) {
  if (prioridad === "urgente") {
    return <Badge variante="red">Urgente</Badge>;
  }

  if (prioridad === "alta") {
    return <Badge variante="yellow">Alta</Badge>;
  }

  return <Badge variante="slate">Normal</Badge>;
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

      <div className="mt-3 text-3xl font-black">{valor}</div>

      <p className="mt-2 text-sm text-slate-400">{detalle}</p>
    </Card>
  );
}

function Filtro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
        activo
          ? "border-amber-400 bg-amber-500 text-slate-950"
          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

function Campo({
  titulo,
  children,
  anchoCompleto = false,
}: {
  titulo: string;
  children: ReactNode;
  anchoCompleto?: boolean;
}) {
  return (
    <label className={anchoCompleto ? "md:col-span-2" : ""}>
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {titulo}
      </span>

      {children}
    </label>
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

      <p className="mt-1 font-semibold text-slate-200">{valor}</p>
    </div>
  );
}

function fechaUY(fecha?: string | null) {
  if (!fecha) return "-";

  const [anio, mes, dia] = fecha.slice(0, 10).split("-");

  if (!anio || !mes || !dia) return fecha;

  return `${dia}/${mes}/${anio}`;
}