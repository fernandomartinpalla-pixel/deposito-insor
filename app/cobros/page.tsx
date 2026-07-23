"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LayoutOperaciones from "@/components/LayoutOperaciones";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

import type { Cliente } from "@/types/cliente";
import type { Cobro, EstadoCobro, MonedaCobro } from "@/types/cobro";

import {
  cargarCobros,
  guardarCobro,
  actualizarCobro,
  cambiarEstadoCobro,
  eliminarCobro,
  subirReciboCobro,
} from "@/lib/cobros";
import { cargarClientes as cargarClientesDB } from "@/lib/clientes";

type FiltroCobro = "pendientes" | "cobrados" | "reprogramados" | "todos";

type CobroConRecibo = Cobro & {
  recibo_url?: string | null;
};

export default function CobrosPage() {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [cobroEditando, setCobroEditando] = useState<Cobro | null>(null);
  const [filtro, setFiltro] = useState<FiltroCobro>("pendientes");
  const [busqueda, setBusqueda] = useState("");
  const [cobroParaConfirmar, setCobroParaConfirmar] = useState<CobroConRecibo | null>(null);
  const [fotoRecibo, setFotoRecibo] = useState<File | null>(null);
  const [guardandoRecibo, setGuardandoRecibo] = useState(false);

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [factura, setFactura] = useState("");
  const [moneda, setMoneda] = useState<MonedaCobro>("UYU");
  const [monto, setMonto] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState(new Date().toISOString().slice(0, 10));
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");

useEffect(() => {
  cargarDatos();

  const canalCobros = supabase
    .channel("cambios-cobros")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cobros",
      },
      () => {
        cargarDatos(true);
      }
    )
    .subscribe();

  const respaldo = setInterval(() => {
    cargarDatos(true);
  }, 30000);

  return () => {
    clearInterval(respaldo);
    supabase.removeChannel(canalCobros);
  };
}, []);

async function cargarDatos(silencioso = false) {
  try {
    if (!silencioso) {
      setCargando(true);
      setMensaje("");
    }

    const [listaCobros, listaClientes] = await Promise.all([
      cargarCobros(),
      cargarClientesDB(),
    ]);

    setCobros(listaCobros);
    setClientes(listaClientes);
  } catch (error: any) {
    setMensaje(error.message || "No se pudieron cargar los cobros.");
  } finally {
    if (!silencioso) {
      setCargando(false);
    }
  }
}

  function seleccionarCliente(nombre: string) {
    setCliente(nombre);
    const encontrado = clientes.find(
      (item) => item.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
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

  function limpiarFormulario() {
    setClienteId(null);
    setCliente("");
    setDireccion("");
    setDepartamento("");
    setTelefono("");
    setFactura("");
    setMoneda("UYU");
    setMonto("");
    setFechaProgramada(new Date().toISOString().slice(0, 10));
    setResponsable("");
    setObservaciones("");
  }

  function abrirNuevoCobro() {
    limpiarFormulario();
    setCobroEditando(null);
    setPanelAbierto(true);
  }

  function abrirEdicion(cobro: Cobro) {
    setCobroEditando(cobro);
    setClienteId(cobro.cliente_id ?? null);
    setCliente(cobro.cliente || "");
    setDireccion(cobro.direccion || "");
    setDepartamento(cobro.departamento || "");
    setTelefono(cobro.telefono || "");
    setFactura(cobro.factura || "");
    setMoneda(cobro.moneda);
    setMonto(String(cobro.monto ?? ""));
    setFechaProgramada(cobro.fecha_programada?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    setResponsable(cobro.responsable || "");
    setObservaciones(cobro.observaciones || "");
    setPanelAbierto(true);
  }

  function cerrarPanel() {
    setPanelAbierto(false);
    setCobroEditando(null);
    limpiarFormulario();
  }

  async function guardarFormulario() {
    setMensaje("");

    if (!cliente.trim()) return setMensaje("Seleccioná o escribí un cliente.");
    if (!monto || Number(monto) <= 0) return setMensaje("Ingresá un monto válido.");
    if (!fechaProgramada) return setMensaje("Ingresá la fecha del cobro.");
    const facturaNormalizada = factura.trim().toLowerCase();

if (facturaNormalizada) {
  const facturaDuplicada = cobros.some((cobro) => {
    const mismoNumero =
      (cobro.factura || "").trim().toLowerCase() === facturaNormalizada;

    const esOtroCobro =
      !cobroEditando || cobro.id !== cobroEditando.id;

    return mismoNumero && esOtroCobro;
  });

  if (facturaDuplicada) {
    setMensaje(`Ya existe un cobro con la factura ${factura.trim()}.`);
    return;
  }
}
    try {
      setGuardando(true);
      const datos = {
        clienteId,
        cliente,
        direccion,
        departamento,
        telefono,
        factura,
        moneda,
        monto,
        fechaProgramada,
        responsable,
        observaciones,
      };

      if (cobroEditando) {
        await actualizarCobro({ id: cobroEditando.id, ...datos });
      } else {
        await guardarCobro(datos);
      }

      cerrarPanel();
      await cargarDatos();
      setMensaje(cobroEditando ? "Cobro actualizado correctamente." : "Cobro agregado correctamente.");
    } catch (error: any) {
      setMensaje(error.message || "No se pudo guardar el cobro.");
    } finally {
      setGuardando(false);
    }
  }

  function solicitarRecibo(cobro: Cobro) {
    setMensaje("");
    setFotoRecibo(null);
    setCobroParaConfirmar(cobro as CobroConRecibo);
  }

  function cerrarConfirmacionCobro() {
    if (guardandoRecibo) return;
    setCobroParaConfirmar(null);
    setFotoRecibo(null);
  }

  async function confirmarCobroConRecibo() {
    if (!cobroParaConfirmar) return;

    if (!fotoRecibo) {
      setMensaje("Tenés que sacar o seleccionar una foto del recibo.");
      return;
    }

    try {
      setGuardandoRecibo(true);
      setMensaje("");

      const archivoComprimido = await comprimirImagen(fotoRecibo);
      const reciboUrl = await subirReciboCobro(
        cobroParaConfirmar.id,
        archivoComprimido
      );

      await cambiarEstadoCobro(
        cobroParaConfirmar.id,
        "cobrado",
        "Sin especificar",
        reciboUrl
      );

await cargarDatos();

setCobroParaConfirmar(null);
setFotoRecibo(null);

setMensaje("Cobro registrado y recibo guardado correctamente.");
    } catch (error: any) {
      setMensaje(error.message || "No se pudo guardar el cobro y su recibo.");
    } finally {
      setGuardandoRecibo(false);
    }
  }

  async function actualizarEstado(id: number, estado: EstadoCobro) {
    try {
      setMensaje("");
      await cambiarEstadoCobro(id, estado);
      await cargarDatos();

      const mensajes: Record<EstadoCobro, string> = {
        pendiente: "Cobro devuelto a pendientes.",
        cobrado: "Cobro registrado correctamente.",
        reprogramado: "Cobro marcado como reprogramado.",
        no_cobrado: "Cobro marcado como no cobrado.",
      };
      setMensaje(mensajes[estado]);
    } catch (error: any) {
      setMensaje(error.message || "No se pudo actualizar el cobro.");
    }
  }

  async function borrarCobro(id: number) {
    if (!window.confirm("¿Seguro que querés eliminar este cobro?")) return;

    try {
      await eliminarCobro(id);
      await cargarDatos();
      setMensaje("Cobro eliminado.");
    } catch (error: any) {
      setMensaje(error.message || "No se pudo eliminar el cobro.");
    }
  }

  const resumen = useMemo(() => {
    const pendientes = cobros.filter((c) => c.estado === "pendiente");
    return {
      pendientes: pendientes.length,
      cobrados: cobros.filter((c) => c.estado === "cobrado").length,
      pendienteUYU: pendientes.filter((c) => c.moneda === "UYU").reduce((t, c) => t + Number(c.monto), 0),
      pendienteUSD: pendientes.filter((c) => c.moneda === "USD").reduce((t, c) => t + Number(c.monto), 0),
    };
  }, [cobros]);

  const cobrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return cobros.filter((cobro) => {
      const coincideFiltro =
        filtro === "todos" ||
        (filtro === "pendientes" && cobro.estado === "pendiente") ||
        (filtro === "cobrados" && cobro.estado === "cobrado") ||
        (filtro === "reprogramados" && cobro.estado === "reprogramado");

      const coincideBusqueda =
        !texto ||
        cobro.cliente.toLowerCase().includes(texto) ||
        cobro.factura?.toLowerCase().includes(texto) ||
        cobro.direccion?.toLowerCase().includes(texto) ||
        cobro.departamento?.toLowerCase().includes(texto);

      return coincideFiltro && coincideBusqueda;
    });
  }, [cobros, filtro, busqueda]);

  return (
    <LayoutOperaciones titulo="Cobros">
      <main className="p-3 sm:p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5">
            <Link href="/" className="text-sm font-bold text-slate-400 transition hover:text-white">
              ← Volver a Insor Operaciones
            </Link>
          </div>

          <PageHeader
            etiqueta="INSOR OPERACIONES"
            titulo="Cobros"
            descripcion="Organizá los cobros pendientes, registrá resultados y mantené el historial de cobranza."
            acciones={<Button onClick={abrirNuevoCobro}>+ Nuevo cobro</Button>}
          />

          {mensaje && (
            <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-emerald-100">
              {mensaje}
            </div>
          )}

          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Resumen titulo="Pendientes" valor={String(resumen.pendientes)} detalle="Cobros por realizar" />
            <Resumen titulo="Pendiente UYU" valor={formatearDinero(resumen.pendienteUYU, "UYU")} detalle="Total en pesos" />
            <Resumen titulo="Pendiente USD" valor={formatearDinero(resumen.pendienteUSD, "USD")} detalle="Total en dólares" />
            <Resumen titulo="Cobrados" valor={String(resumen.cobrados)} detalle="Registrados en historial" />
          </section>

          <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["pendientes", "cobrados", "reprogramados", "todos"] as FiltroCobro[]).map((item) => (
                <Filtro key={item} activo={filtro === item} onClick={() => setFiltro(item)}>
                  {item[0].toUpperCase() + item.slice(1)}
                </Filtro>
              ))}
            </div>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente, factura o dirección..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 outline-none transition focus:border-emerald-500 lg:w-96"
            />
          </section>

          {cargando ? (
            <Card><p className="text-center text-slate-400">Cargando cobros...</p></Card>
          ) : cobrosFiltrados.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <div className="text-5xl">💰</div>
                <h2 className="mt-4 text-lg font-black">No hay cobros para mostrar</h2>
                <p className="mt-2 text-slate-400">Creá un nuevo cobro o cambiá el filtro.</p>
              </div>
            </Card>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cobrosFiltrados.map((cobro) => (
                <TarjetaCobro
                  key={cobro.id}
                  cobro={cobro}
                  onEstado={actualizarEstado}
                  onMarcarCobrado={solicitarRecibo}
                  onEditar={abrirEdicion}
                  onEliminar={borrarCobro}
                />
              ))}
            </section>
          )}
        </div>

        {panelAbierto && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
            <div className="mx-auto my-6 max-w-3xl">
              <Card className="border-emerald-500/40">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400">
                      {cobroEditando ? "Editar" : "Nuevo"}
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                      {cobroEditando ? "Editar cobro" : "Nuevo cobro"}
                    </h2>
                  </div>
                  <button type="button" onClick={cerrarPanel} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-lg hover:bg-slate-700">×</button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Campo titulo="Cliente" anchoCompleto>
                    <input list="lista-clientes-cobros" value={cliente} onChange={(e) => seleccionarCliente(e.target.value)} placeholder="Buscar o escribir cliente..." className="input-cobro" />
                    <datalist id="lista-clientes-cobros">
                      {clientes.map((item) => <option key={item.id ?? item.nombre} value={item.nombre} />)}
                    </datalist>
                  </Campo>
                  <Campo titulo="Dirección"><input value={direccion} onChange={(e) => setDireccion(e.target.value)} className="input-cobro" /></Campo>
                  <Campo titulo="Departamento"><input value={departamento} onChange={(e) => setDepartamento(e.target.value)} className="input-cobro" /></Campo>
                  <Campo titulo="Teléfono"><input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="input-cobro" /></Campo>
                  <Campo titulo="Factura o referencia"><input value={factura} onChange={(e) => setFactura(e.target.value)} className="input-cobro" /></Campo>
                  <Campo titulo="Moneda">
                    <select value={moneda} onChange={(e) => setMoneda(e.target.value as MonedaCobro)} className="input-cobro">
                      <option value="UYU">UYU - Pesos</option>
                      <option value="USD">USD - Dólares</option>
                    </select>
                  </Campo>
                  <Campo titulo="Monto"><input type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} className="input-cobro" /></Campo>
                  <Campo titulo="Fecha programada"><input type="date" value={fechaProgramada} onChange={(e) => setFechaProgramada(e.target.value)} className="input-cobro" /></Campo>
                  <Campo titulo="Responsable"><input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre del cobrador" className="input-cobro" /></Campo>
                  <Campo titulo="Observaciones" anchoCompleto><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={4} className="input-cobro resize-none" /></Campo>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variante="secondary" onClick={cerrarPanel}>Cancelar</Button>
                  <Button variante="success" disabled={guardando} onClick={guardarFormulario}>
                    {guardando ? "Guardando..." : cobroEditando ? "Guardar cambios" : "Guardar cobro"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}


        {cobroParaConfirmar && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
            <div className="mx-auto my-8 max-w-lg">
              <Card className="border-emerald-500/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
                      Confirmar cobro
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                      Foto del recibo
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {cobroParaConfirmar.cliente} · {formatearDinero(cobroParaConfirmar.monto, cobroParaConfirmar.moneda)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={cerrarConfirmacionCobro}
                    disabled={guardandoRecibo}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-slate-600 bg-slate-950 p-5">
                  <label className="block cursor-pointer text-center">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) => {
                        const archivo = event.target.files?.[0] || null;
                        setFotoRecibo(archivo);
                      }}
                    />

                    <div className="text-4xl">📷</div>
                    <p className="mt-3 font-black text-white">
                      Sacar foto o elegir imagen
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      La imagen se reducirá automáticamente antes de subirla.
                    </p>
                  </label>
                </div>

                {fotoRecibo && (
                  <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="font-bold text-emerald-200">
                      ✓ Foto seleccionada
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-300">
                      {fotoRecibo.name}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    variante="secondary"
                    onClick={cerrarConfirmacionCobro}
                    disabled={guardandoRecibo}
                  >
                    Cancelar
                  </Button>

                  <Button
                    variante="success"
                    onClick={confirmarCobroConRecibo}
                    disabled={guardandoRecibo || !fotoRecibo}
                  >
                    {guardandoRecibo
                      ? "Guardando recibo..."
                      : "Confirmar cobro"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        <style jsx global>{`
          .input-cobro {
            width: 100%;
            border: 1px solid rgb(51 65 85);
            border-radius: 1rem;
            background: rgb(2 6 23);
            padding: 0.85rem 1rem;
            color: white;
            outline: none;
            transition: border-color 150ms ease;
          }
          .input-cobro:focus { border-color: rgb(16 185 129); }
        `}</style>
      </main>
    </LayoutOperaciones>
  );
}

function TarjetaCobro({
  cobro,
  onEstado,
  onMarcarCobrado,
  onEditar,
  onEliminar,
}: {
  cobro: CobroConRecibo;
  onEstado: (id: number, estado: EstadoCobro) => void;
  onMarcarCobrado: (cobro: Cobro) => void;
  onEditar: (cobro: Cobro) => void;
  onEliminar: (id: number) => void;
}) {
  return (
    <Card className="transition hover:-translate-y-1 hover:border-emerald-500/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <EstadoCobroBadge estado={cobro.estado} />
          <h2 className="mt-4 text-xl font-black">{cobro.cliente}</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onEditar(cobro)} className="rounded-xl bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/20">Editar</button>
          <button type="button" onClick={() => onEliminar(cobro.id)} className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20">Eliminar</button>
        </div>
      </div>

      <div className="mt-5 text-2xl font-black text-emerald-300">
        {formatearDinero(cobro.monto, cobro.moneda)}
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <Dato titulo="Fecha" valor={fechaUY(cobro.fecha_programada)} />
        <Dato titulo="Factura" valor={cobro.factura || "-"} />
        <Dato titulo="Dirección" valor={[cobro.direccion, cobro.departamento].filter(Boolean).join(" · ") || "-"} />
        <Dato titulo="Teléfono" valor={cobro.telefono || "-"} />
        <Dato titulo="Responsable" valor={cobro.responsable || "-"} />
      </div>

      {cobro.observaciones && (
        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
          {cobro.observaciones}
        </div>
      )}

      {cobro.estado === "pendiente" ? (
        <div className="mt-6 grid gap-2">
          <Button variante="success" anchoCompleto onClick={() => onMarcarCobrado(cobro)}>
            ✓ Marcar cobrado
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variante="secondary" onClick={() => onEstado(cobro.id, "reprogramado")}>Reprogramar</Button>
            <Button variante="danger" onClick={() => onEstado(cobro.id, "no_cobrado")}>No cobrado</Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-2">
          {cobro.estado === "cobrado" && (
            <>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center font-bold text-emerald-200">
                Cobro completado{cobro.forma_cobro ? ` · ${cobro.forma_cobro}` : ""}
              </div>

              {cobro.recibo_url ? (
                <a
                  href={cobro.recibo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center font-black text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  📄 Ver recibo
                </a>
              ) : (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-sm font-bold text-amber-200">
                  Este cobro no tiene recibo adjunto.
                </div>
              )}
            </>
          )}
          <Button variante="secondary" anchoCompleto onClick={() => onEstado(cobro.id, "pendiente")}>
            ↩ Volver a pendiente
          </Button>
        </div>
      )}
    </Card>
  );
}

function EstadoCobroBadge({ estado }: { estado: EstadoCobro }) {
  if (estado === "cobrado") return <Badge variante="green">Cobrado</Badge>;
  if (estado === "reprogramado") return <Badge variante="yellow">Reprogramado</Badge>;
  if (estado === "no_cobrado") return <Badge variante="red">No cobrado</Badge>;
  return <Badge variante="cyan">Pendiente</Badge>;
}

function Resumen({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <Card>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{titulo}</p>
      <div className="mt-3 text-2xl font-black">{valor}</div>
      <p className="mt-2 text-sm text-slate-400">{detalle}</p>
    </Card>
  );
}

function Filtro({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${activo ? "border-emerald-400 bg-emerald-500 text-emerald-950" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"}`}>
      {children}
    </button>
  );
}

function Campo({ titulo, children, anchoCompleto = false }: { titulo: string; children: React.ReactNode; anchoCompleto?: boolean }) {
  return (
    <label className={anchoCompleto ? "md:col-span-2" : ""}>
      <span className="mb-2 block text-sm font-bold text-slate-300">{titulo}</span>
      {children}
    </label>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{titulo}</p>
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

function formatearDinero(valor: number, moneda: MonedaCobro) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
}


async function comprimirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const imagen = await cargarImagen(archivo);
  const anchoMaximo = 1400;
  const escala = Math.min(1, anchoMaximo / imagen.width);
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error("No se pudo procesar la imagen.");
  }

  contexto.drawImage(imagen, 0, 0, ancho, alto);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resultado) => {
        if (resultado) resolve(resultado);
        else reject(new Error("No se pudo comprimir la imagen."));
      },
      "image/jpeg",
      0.78
    );
  });

  return new File(
    [blob],
    `recibo-${Date.now()}.jpg`,
    { type: "image/jpeg" }
  );
}

function cargarImagen(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();

    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagen);
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen seleccionada."));
    };

    imagen.src = url;
  });
}