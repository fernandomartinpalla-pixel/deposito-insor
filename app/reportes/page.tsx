"use client";

import { useEffect, useMemo, useState } from "react";

import LayoutOperaciones from "@/components/LayoutOperaciones";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

import type { Entrega } from "@/types/entrega";
import type { Cobro, MonedaCobro } from "@/types/cobro";
import type { Visita } from "@/types/visita";

import {
  cargarPedidosEnReparto,
  cargarPedidosProntosDeposito,
  cargarHistorial,
} from "@/lib/entregas";
import { cargarCobros } from "@/lib/cobros";
import { cargarVisitas } from "@/lib/visitas";

type FiltroModulo = "todos" | "entregas" | "cobros" | "visitas";

type RegistroReporte = {
  clave: string;
  tipo: "entrega" | "cobro" | "visita";
  fecha: string;
  cliente: string;
  estado: string;
  detalle: string;
  moneda?: MonedaCobro;
  monto?: number;
};

export default function ReportesPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);

  const [desde, setDesde] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10)
  );
  const [hasta, setHasta] = useState(new Date().toISOString().slice(0, 10));
  const [cliente, setCliente] = useState("");
  const [modulo, setModulo] = useState<FiltroModulo>("todos");

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setMensaje("");

      const [reparto, deposito, historial, listaCobros, listaVisitas] =
        await Promise.all([
          cargarPedidosEnReparto(),
          cargarPedidosProntosDeposito(),
          cargarHistorial({
            filtro: "todas",
            mesSeleccionado: new Date().toISOString().slice(0, 7),
          }),
          cargarCobros(),
          cargarVisitas(),
        ]);

      setEntregas([...reparto, ...deposito, ...historial]);
      setCobros(listaCobros);
      setVisitas(listaVisitas);
    } catch (error: any) {
      setMensaje(error.message || "No se pudieron cargar los reportes.");
    } finally {
      setCargando(false);
    }
  }

  const registros = useMemo<RegistroReporte[]>(() => {
    const registrosEntregas: RegistroReporte[] = entregas.map((entrega) => ({
      clave: `entrega-${entrega.id}`,
      tipo: "entrega",
      fecha: (
        entrega.fecha_entregado_real ||
        entrega.fecha_entregado ||
        entrega.fecha_entrega_programada ||
        entrega.fecha_pedido ||
        ""
      ).slice(0, 10),
      cliente: entrega.cliente || "Sin cliente",
      estado: entrega.estado,
      detalle: entrega.numero_factura
        ? `Factura ${entrega.numero_factura}`
        : "Entrega",
      monto: Number(entrega.monto || 0),
    }));

    const registrosCobros: RegistroReporte[] = cobros.map((cobro) => ({
      clave: `cobro-${cobro.id}`,
      tipo: "cobro",
      fecha: (
        cobro.fecha_cobrado ||
        cobro.fecha_programada ||
        cobro.created_at ||
        ""
      ).slice(0, 10),
      cliente: cobro.cliente || "Sin cliente",
      estado: cobro.estado,
      detalle: cobro.factura
        ? `Factura ${cobro.factura}`
        : "Cobro",
      moneda: cobro.moneda,
      monto: Number(cobro.monto || 0),
    }));

    const registrosVisitas: RegistroReporte[] = visitas.map((visita) => ({
      clave: `visita-${visita.id}`,
      tipo: "visita",
      fecha: (
        visita.fecha_realizada ||
        visita.fecha_programada ||
        visita.created_at ||
        ""
      ).slice(0, 10),
      cliente: visita.cliente || "Sin cliente",
      estado: visita.estado,
      detalle: visita.motivo || "Visita comercial",
    }));

    return [
      ...registrosEntregas,
      ...registrosCobros,
      ...registrosVisitas,
    ].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [entregas, cobros, visitas]);

  const registrosFiltrados = useMemo(() => {
    const texto = cliente.trim().toLowerCase();

    return registros.filter((registro) => {
      const coincideModulo =
        modulo === "todos" || registro.tipo === modulo.slice(0, -1);

      const coincideCliente =
        !texto || registro.cliente.toLowerCase().includes(texto);

      const coincideDesde = !desde || registro.fecha >= desde;
      const coincideHasta = !hasta || registro.fecha <= hasta;

      return (
        coincideModulo &&
        coincideCliente &&
        coincideDesde &&
        coincideHasta
      );
    });
  }, [registros, modulo, cliente, desde, hasta]);

  const resumen = useMemo(() => {
    const entregasFiltradas = registrosFiltrados.filter(
      (registro) => registro.tipo === "entrega"
    );
    const cobrosFiltrados = registrosFiltrados.filter(
      (registro) => registro.tipo === "cobro"
    );
    const visitasFiltradas = registrosFiltrados.filter(
      (registro) => registro.tipo === "visita"
    );

    return {
      entregas: entregasFiltradas.length,
      cobros: cobrosFiltrados.length,
      visitas: visitasFiltradas.length,
      cobradoUYU: cobrosFiltrados
        .filter(
          (registro) =>
            registro.estado === "cobrado" &&
            registro.moneda === "UYU"
        )
        .reduce((total, registro) => total + Number(registro.monto || 0), 0),
      cobradoUSD: cobrosFiltrados
        .filter(
          (registro) =>
            registro.estado === "cobrado" &&
            registro.moneda === "USD"
        )
        .reduce((total, registro) => total + Number(registro.monto || 0), 0),
      pendienteUYU: cobrosFiltrados
        .filter(
          (registro) =>
            registro.estado === "pendiente" &&
            registro.moneda === "UYU"
        )
        .reduce((total, registro) => total + Number(registro.monto || 0), 0),
      pendienteUSD: cobrosFiltrados
        .filter(
          (registro) =>
            registro.estado === "pendiente" &&
            registro.moneda === "USD"
        )
        .reduce((total, registro) => total + Number(registro.monto || 0), 0),
    };
  }, [registrosFiltrados]);

  function exportarCSV() {
    if (registrosFiltrados.length === 0) {
      setMensaje("No hay datos para exportar.");
      return;
    }

    const encabezados = [
      "Fecha",
      "Tipo",
      "Cliente",
      "Estado",
      "Detalle",
      "Moneda",
      "Monto",
    ];

    const filas = registrosFiltrados.map((registro) => [
      registro.fecha,
      etiquetaTipo(registro.tipo),
      registro.cliente,
      registro.estado,
      registro.detalle,
      registro.moneda || "",
      registro.monto ?? "",
    ]);

    const csv = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = `reporte-insor-${desde || "inicio"}-${
      hasta || "hoy"
    }.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    setMensaje("Reporte exportado correctamente.");
  }

  return (
    <LayoutOperaciones titulo="Reportes">
      <main className="p-3 sm:p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <PageHeader
            etiqueta="INSOR OPERACIONES"
            titulo="Reportes"
            descripcion="Consultá entregas, cobros y visitas por período y exportá los resultados."
            acciones={
              <div className="flex flex-wrap gap-2">
                <Button variante="secondary" onClick={cargarDatos}>
                  Actualizar
                </Button>
                <Button onClick={exportarCSV}>Exportar CSV</Button>
              </div>
            }
          />

          {mensaje && (
            <div className="mb-6 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-4 text-cyan-100">
              {mensaje}
            </div>
          )}

          <Card className="mb-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Campo titulo="Desde">
                <input
                  type="date"
                  value={desde}
                  onChange={(event) => setDesde(event.target.value)}
                  className="input-reporte"
                />
              </Campo>

              <Campo titulo="Hasta">
                <input
                  type="date"
                  value={hasta}
                  onChange={(event) => setHasta(event.target.value)}
                  className="input-reporte"
                />
              </Campo>

              <Campo titulo="Cliente">
                <input
                  value={cliente}
                  onChange={(event) => setCliente(event.target.value)}
                  placeholder="Buscar cliente..."
                  className="input-reporte"
                />
              </Campo>

              <Campo titulo="Módulo">
                <select
                  value={modulo}
                  onChange={(event) =>
                    setModulo(event.target.value as FiltroModulo)
                  }
                  className="input-reporte"
                >
                  <option value="todos">Todos</option>
                  <option value="entregas">Entregas</option>
                  <option value="cobros">Cobros</option>
                  <option value="visitas">Visitas</option>
                </select>
              </Campo>
            </div>
          </Card>

          <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Resumen
              titulo="Entregas"
              valor={String(resumen.entregas)}
              detalle="Registros del período"
            />
            <Resumen
              titulo="Cobros"
              valor={String(resumen.cobros)}
              detalle="Registros del período"
            />
            <Resumen
              titulo="Visitas"
              valor={String(resumen.visitas)}
              detalle="Registros del período"
            />
          </section>

          <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Resumen
              titulo="Cobrado UYU"
              valor={formatearDinero(resumen.cobradoUYU, "UYU")}
              detalle="Cobros completados"
            />
            <Resumen
              titulo="Cobrado USD"
              valor={formatearDinero(resumen.cobradoUSD, "USD")}
              detalle="Cobros completados"
            />
            <Resumen
              titulo="Pendiente UYU"
              valor={formatearDinero(resumen.pendienteUYU, "UYU")}
              detalle="Cobros pendientes"
            />
            <Resumen
              titulo="Pendiente USD"
              valor={formatearDinero(resumen.pendienteUSD, "USD")}
              detalle="Cobros pendientes"
            />
          </section>

          {cargando ? (
            <Card>
              <p className="py-10 text-center text-slate-400">
                Cargando reportes...
              </p>
            </Card>
          ) : registrosFiltrados.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <div className="text-5xl">📊</div>
                <h2 className="mt-4 text-lg font-black">
                  No hay registros para mostrar
                </h2>
                <p className="mt-2 text-slate-400">
                  Cambiá los filtros para ampliar la búsqueda.
                </p>
              </div>
            </Card>
          ) : (
            <section className="grid gap-4">
              {registrosFiltrados.map((registro) => (
                <Card key={registro.clave}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <TipoBadge tipo={registro.tipo} />
                        <Badge variante="slate">
                          {fechaUY(registro.fecha)}
                        </Badge>
                        <EstadoBadge estado={registro.estado} />
                      </div>

                      <h2 className="mt-3 text-lg font-black text-white">
                        {registro.cliente}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        {registro.detalle}
                      </p>
                    </div>

                    {registro.monto !== undefined && registro.moneda && (
                      <div className="text-xl font-black text-emerald-300">
                        {formatearDinero(
                          Number(registro.monto),
                          registro.moneda
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </section>
          )}
        </div>

        <style jsx global>{`
          .input-reporte {
            width: 100%;
            border: 1px solid rgb(51 65 85);
            border-radius: 1rem;
            background: rgb(2 6 23);
            padding: 0.8rem 1rem;
            color: white;
            outline: none;
          }

          .input-reporte:focus {
            border-color: rgb(34 211 238);
          }
        `}</style>
      </main>
    </LayoutOperaciones>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {titulo}
      </span>
      {children}
    </label>
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
      <div className="mt-3 text-2xl font-black">{valor}</div>
      <p className="mt-2 text-sm text-slate-400">{detalle}</p>
    </Card>
  );
}

function TipoBadge({
  tipo,
}: {
  tipo: RegistroReporte["tipo"];
}) {
  if (tipo === "entrega") {
    return <Badge variante="cyan">🚚 Entrega</Badge>;
  }

  if (tipo === "cobro") {
    return <Badge variante="green">💰 Cobro</Badge>;
  }

  return <Badge variante="yellow">👤 Visita</Badge>;
}

function EstadoBadge({ estado }: { estado: string }) {
  if (
    estado === "entregado" ||
    estado === "cobrado" ||
    estado === "realizada"
  ) {
    return <Badge variante="green">{estado}</Badge>;
  }

  if (estado === "pendiente" || estado === "a_entregar") {
    return <Badge variante="cyan">{estado}</Badge>;
  }

  if (estado === "reprogramado" || estado === "reprogramada") {
    return <Badge variante="yellow">{estado}</Badge>;
  }

  return <Badge variante="red">{estado}</Badge>;
}

function etiquetaTipo(tipo: RegistroReporte["tipo"]) {
  if (tipo === "entrega") return "Entrega";
  if (tipo === "cobro") return "Cobro";
  return "Visita";
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
