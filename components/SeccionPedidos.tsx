"use client";

import { useMemo, useState } from "react";
import type {
  Entrega,
  EstadoEntrega,
  TipoEntrega,
} from "@/types/entrega";
import TablaPedidos from "./TablaPedidos";

type FiltroTipoEntrega = "todos" | TipoEntrega;

type Props = {
  titulo: string;
  descripcion?: string;
  entregas: Entrega[];
  seleccionados: number[];
  mostrarFiltroTipo?: boolean;
  onSeleccionar: (id: number) => void;
  onEditar: (entrega: Entrega) => void;
  onImprimirEtiqueta: (entrega: Entrega) => void;
  onCambiarEstadoPedido?: (
    id: number,
    estado: EstadoEntrega
  ) => void;
};

export default function SeccionPedidos({
  titulo,
  descripcion,
  entregas,
  seleccionados,
  mostrarFiltroTipo = false,
  onSeleccionar,
  onEditar,
  onImprimirEtiqueta,
  onCambiarEstadoPedido,
}: Props) {
  const [filtroTipo, setFiltroTipo] =
    useState<FiltroTipoEntrega>("todos");

  const cantidadDomicilio = useMemo(() => {
    return entregas.filter(
      (entrega) =>
        (entrega.tipo_entrega || "domicilio") === "domicilio"
    ).length;
  }, [entregas]);

  const cantidadRetiro = useMemo(() => {
    return entregas.filter(
      (entrega) => entrega.tipo_entrega === "retiro"
    ).length;
  }, [entregas]);

  const entregasFiltradas = useMemo(() => {
    if (!mostrarFiltroTipo || filtroTipo === "todos") {
      return entregas;
    }

    return entregas.filter((entrega) => {
      const tipo = entrega.tipo_entrega || "domicilio";
      return tipo === filtroTipo;
    });
  }, [entregas, filtroTipo, mostrarFiltroTipo]);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          {titulo}
        </h2>

        {descripcion && (
          <p className="mt-1 text-sm text-slate-400">
            {descripcion}
          </p>
        )}

        {mostrarFiltroTipo && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <BotonFiltro
                activo={filtroTipo === "todos"}
                onClick={() => setFiltroTipo("todos")}
              >
                Todos ({entregas.length})
              </BotonFiltro>

              <BotonFiltro
                activo={filtroTipo === "domicilio"}
                onClick={() => setFiltroTipo("domicilio")}
              >
                🚚 Domicilio ({cantidadDomicilio})
              </BotonFiltro>

              <BotonFiltro
                activo={filtroTipo === "retiro"}
                onClick={() => setFiltroTipo("retiro")}
              >
                🏪 Retiro ({cantidadRetiro})
              </BotonFiltro>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Mostrando {entregasFiltradas.length} de{" "}
              {entregas.length} pedidos
            </p>
          </>
        )}
      </div>

      <TablaPedidos
        entregas={entregasFiltradas}
        seleccionados={seleccionados}
        onSeleccionar={onSeleccionar}
        onEditar={onEditar}
        onImprimirEtiqueta={onImprimirEtiqueta}
        onCambiarEstadoPedido={onCambiarEstadoPedido}
      />
    </section>
  );
}

function BotonFiltro({
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
      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
        activo
          ? "border-cyan-400 bg-cyan-500 text-slate-950"
          : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}