"use client";
import LayoutOperaciones from "@/components/LayoutOperaciones";
import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import type { Cliente } from "@/types/cliente";
import type {
  Cobro,
  EstadoCobro,
  MonedaCobro,
} from "@/types/cobro";

import {
  cargarCobros,
  guardarCobro,
  cambiarEstadoCobro,
  eliminarCobro,
} from "@/lib/cobros";

import {
  cargarClientes as cargarClientesDB,
} from "@/lib/clientes";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

type FiltroCobro =
  | "pendientes"
  | "cobrados"
  | "reprogramados"
  | "todos";

export default function CobrosPage() {
  
  const procesado = useRef(false);
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [filtro, setFiltro] = useState<FiltroCobro>("pendientes");
  const [busqueda, setBusqueda] = useState("");

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [telefono, setTelefono] = useState("");

  const [factura, setFactura] = useState("");
  const [moneda, setMoneda] = useState<MonedaCobro>("UYU");
  const [monto, setMonto] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);




  async function cargarDatos() {
    try {
      setCargando(true);
      setMensaje("");

      const [listaCobros, listaClientes] = await Promise.all([
        cargarCobros(),
        cargarClientesDB(),
      ]);

      setCobros(listaCobros);
      setClientes(listaClientes);
    } catch (error: any) {
      setMensaje(error.message || "No se pudieron cargar los cobros.");
    } finally {
      setCargando(false);
    }
  }

  function seleccionarCliente(nombre: string) {
    setCliente(nombre);

    const encontrado = clientes.find(
      (item) =>
        item.nombre.trim().toLowerCase() ===
        nombre.trim().toLowerCase()
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

  async function crearCobro() {
    setMensaje("");

    if (!cliente.trim()) {
      setMensaje("Seleccioná o escribí un cliente.");
      return;
    }

    if (!monto || Number(monto) <= 0) {
      setMensaje("Ingresá un monto válido.");
      return;
    }

    if (!fechaProgramada) {
      setMensaje("Ingresá la fecha del cobro.");
      return;
    }

    try {
      setGuardando(true);

      await guardarCobro({
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
      });

      limpiarFormulario();
      setPanelAbierto(false);

      await cargarDatos();

      setMensaje("Cobro agregado correctamente.");
    } catch (error: any) {
      setMensaje(error.message || "No se pudo guardar el cobro.");
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
    setFactura("");
    setMoneda("UYU");
    setMonto("");
    setFechaProgramada(new Date().toISOString().slice(0, 10));
    setResponsable("");
    setObservaciones("");
  }

  async function actualizarEstado(
    id: number,
    estado: EstadoCobro
  ) {
    try {
      setMensaje("");

const formaCobro =
  estado === "cobrado"
    ? "Sin especificar"
    : undefined;

      await cambiarEstadoCobro(id, estado, formaCobro);
      await cargarDatos();

      if (estado === "cobrado") {
        setMensaje("Cobro registrado correctamente.");
      }

      if (estado === "reprogramado") {
        setMensaje("Cobro marcado como reprogramado.");
      }

      if (estado === "no_cobrado") {
        setMensaje("Cobro marcado como no cobrado.");
      }
    } catch (error: any) {
      setMensaje(error.message || "No se pudo actualizar el cobro.");
    }
  }

  async function borrarCobro(id: number) {
    const confirmar = window.confirm(
      "¿Seguro que querés eliminar este cobro?"
    );

    if (!confirmar) return;

    try {
      await eliminarCobro(id);
      await cargarDatos();
      setMensaje("Cobro eliminado.");
    } catch (error: any) {
      setMensaje(error.message || "No se pudo eliminar el cobro.");
    }
  }

  const resumen = useMemo(() => {
    const pendientes = cobros.filter(
      (cobro) => cobro.estado === "pendiente"
    );

    const cobrados = cobros.filter(
      (cobro) => cobro.estado === "cobrado"
    );

    return {
      pendientes: pendientes.length,
      cobrados: cobrados.length,

      pendienteUYU: pendientes
        .filter((cobro) => cobro.moneda === "UYU")
        .reduce((total, cobro) => total + Number(cobro.monto), 0),

      pendienteUSD: pendientes
        .filter((cobro) => cobro.moneda === "USD")
        .reduce((total, cobro) => total + Number(cobro.monto), 0),
    };
  }, [cobros]);

  const cobrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return cobros.filter((cobro) => {
      const coincideFiltro =
        filtro === "todos" ||
        (filtro === "pendientes" &&
          cobro.estado === "pendiente") ||
        (filtro === "cobrados" &&
          cobro.estado === "cobrado") ||
        (filtro === "reprogramados" &&
          cobro.estado === "reprogramado");

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
          <Link
            href="/"
            className="text-sm font-bold text-slate-400 transition hover:text-white"
          >
            ← Volver a Insor Operaciones
          </Link>
        </div>

        <PageHeader
          etiqueta="INSOR OPERACIONES"
          titulo="Cobros"
          descripcion="Organizá los cobros pendientes, registrá resultados y mantené el historial de cobranza."
          acciones={
            <Button onClick={() => setPanelAbierto(true)}>
              + Nuevo cobro
            </Button>
          }
        />

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-emerald-100">
            {mensaje}
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Resumen
            titulo="Pendientes"
            valor={String(resumen.pendientes)}
            detalle="Cobros por realizar"
          />

          <Resumen
            titulo="Pendiente UYU"
            valor={formatearDinero(resumen.pendienteUYU, "UYU")}
            detalle="Total en pesos"
          />

          <Resumen
            titulo="Pendiente USD"
            valor={formatearDinero(resumen.pendienteUSD, "USD")}
            detalle="Total en dólares"
          />

          <Resumen
            titulo="Cobrados"
            valor={String(resumen.cobrados)}
            detalle="Registrados en historial"
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
              activo={filtro === "cobrados"}
              onClick={() => setFiltro("cobrados")}
            >
              Cobrados
            </Filtro>

            <Filtro
              activo={filtro === "reprogramados"}
              onClick={() => setFiltro("reprogramados")}
            >
              Reprogramados
            </Filtro>

            <Filtro
              activo={filtro === "todos"}
              onClick={() => setFiltro("todos")}
            >
              Todos
            </Filtro>
          </div>

          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar cliente, factura o dirección..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 outline-none transition focus:border-emerald-500 lg:w-96"
          />
        </section>

        {cargando ? (
          <Card>
            <p className="text-center text-slate-400">
              Cargando cobros...
            </p>
          </Card>
        ) : cobrosFiltrados.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <div className="text-5xl">💰</div>

              <h2 className="mt-4 text-1g font-black">
                No hay cobros para mostrar
              </h2>

              <p className="mt-2 text-slate-400">
                Creá un nuevo cobro o cambiá el filtro.
              </p>
            </div>
          </Card>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cobrosFiltrados.map((cobro) => (
              <TarjetaCobro
                key={cobro.id}
                cobro={cobro}
                onEstado={actualizarEstado}
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
                    Nuevo
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Nuevo cobro
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPanelAbierto(false);
                    limpiarFormulario();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-1g hover:bg-slate-700"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
              <Campo titulo="Cliente" anchoCompleto>
  <input
    list="lista-clientes-cobros"
    value={cliente}
    onChange={(event) => {
      const valor = event.target.value;

      setCliente(valor);

      const encontrado = clientes.find(
        (item) =>
          item.nombre.trim().toLowerCase() ===
          valor.trim().toLowerCase()
      );

      if (encontrado) {
        setClienteId(encontrado.id ?? null);
        setDireccion(encontrado.direccion || "");
        setDepartamento(encontrado.departamento || "");
        setTelefono(encontrado.telefono || "");
      } else {
        setClienteId(null);
      }
    }}
    placeholder="Buscar o escribir cliente..."
    className="input-cobro"
  />

  <datalist id="lista-clientes-cobros">
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
                    className="input-cobro"
                  />
                </Campo>

                <Campo titulo="Departamento">
                  <input
                    value={departamento}
                    onChange={(event) =>
                      setDepartamento(event.target.value)
                    }
                    className="input-cobro"
                  />
                </Campo>

                <Campo titulo="Teléfono">
                  <input
                    value={telefono}
                    onChange={(event) =>
                      setTelefono(event.target.value)
                    }
                    className="input-cobro"
                  />
                </Campo>

                <Campo titulo="Factura o referencia">
                  <input
                    value={factura}
                    onChange={(event) =>
                      setFactura(event.target.value)
                    }
                    className="input-cobro"
                  />
                </Campo>

                <Campo titulo="Moneda">
                  <select
                    value={moneda}
                    onChange={(event) =>
                      setMoneda(event.target.value as MonedaCobro)
                    }
                    className="input-cobro"
                  >
                    <option value="UYU">UYU - Pesos</option>
                    <option value="USD">USD - Dólares</option>
                  </select>
                </Campo>

                <Campo titulo="Monto">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={monto}
                    onChange={(event) => setMonto(event.target.value)}
                    className="input-cobro"
                  />
                </Campo>

                <Campo titulo="Fecha programada">
                  <input
                    type="date"
                    value={fechaProgramada}
                    onChange={(event) =>
                      setFechaProgramada(event.target.value)
                    }
                    className="input-cobro"
                  />
                </Campo>

                <Campo titulo="Responsable">
                  <input
                    value={responsable}
                    onChange={(event) =>
                      setResponsable(event.target.value)
                    }
                    placeholder="Nombre del cobrador"
                    className="input-cobro"
                  />
                </Campo>

                <Campo titulo="Observaciones" anchoCompleto>
                  <textarea
                    value={observaciones}
                    onChange={(event) =>
                      setObservaciones(event.target.value)
                    }
                    rows={4}
                    className="input-cobro resize-none"
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
                  variante="success"
                  disabled={guardando}
                  onClick={crearCobro}
                >
                  {guardando ? "Guardando..." : "Guardar cobro"}
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

        .input-cobro:focus {
          border-color: rgb(16 185 129);
        }
      `}</style>
     </main>
  </LayoutOperaciones>
);
}

function TarjetaCobro({
  cobro,
  onEstado,
  onEliminar,
}: {
  cobro: Cobro;
  onEstado: (id: number, estado: EstadoCobro) => void;
  onEliminar: (id: number) => void;
}) {
  return (
    <Card className="transition hover:-translate-y-1 hover:border-emerald-500/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <EstadoCobroBadge estado={cobro.estado} />

          <h2 className="mt-4 text-2xl font-black">
            {cobro.cliente}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onEliminar(cobro.id)}
          className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
        >
          Eliminar
        </button>
      </div>

      <div className="mt-5 text-3xl font-black text-emerald-300">
        {formatearDinero(cobro.monto, cobro.moneda)}
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <Dato titulo="Fecha" valor={fechaUY(cobro.fecha_programada)} />
        <Dato titulo="Factura" valor={cobro.factura || "-"} />
        <Dato
          titulo="Dirección"
          valor={[cobro.direccion, cobro.departamento]
            .filter(Boolean)
            .join(" · ") || "-"}
        />
        <Dato titulo="Teléfono" valor={cobro.telefono || "-"} />
        <Dato
          titulo="Responsable"
          valor={cobro.responsable || "-"}
        />
      </div>

      {cobro.observaciones && (
        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
          {cobro.observaciones}
        </div>
      )}

      {cobro.estado !== "cobrado" && (
        <div className="mt-6 grid gap-2">
          <Button
            variante="success"
            anchoCompleto
            onClick={() => onEstado(cobro.id, "cobrado")}
          >
            ✓ Marcar cobrado
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variante="secondary"
              onClick={() => onEstado(cobro.id, "reprogramado")}
            >
              Reprogramar
            </Button>

            <Button
              variante="danger"
              onClick={() => onEstado(cobro.id, "no_cobrado")}
            >
              No cobrado
            </Button>
          </div>
        </div>
      )}

      {cobro.estado === "cobrado" && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center font-bold text-emerald-200">
          Cobro completado
          {cobro.forma_cobro
            ? ` · ${cobro.forma_cobro}`
            : ""}
        </div>
      )}
    </Card>
  );
}

function EstadoCobroBadge({
  estado,
}: {
  estado: EstadoCobro;
}) {
  if (estado === "cobrado") {
    return <Badge variante="green">Cobrado</Badge>;
  }

  if (estado === "reprogramado") {
    return <Badge variante="yellow">Reprogramado</Badge>;
  }

  if (estado === "no_cobrado") {
    return <Badge variante="red">No cobrado</Badge>;
  }

  return <Badge variante="cyan">Pendiente</Badge>;
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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
        activo
          ? "border-emerald-400 bg-emerald-500 text-emerald-950"
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
  children: React.ReactNode;
  anchoCompleto?: boolean;
}) {
  return (
    <label
      className={anchoCompleto ? "md:col-span-2" : ""}
    >
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

function formatearDinero(
  valor: number,
  moneda: MonedaCobro
) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
}