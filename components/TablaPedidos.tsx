"use client";

import { useState } from "react";
import {
  Entrega,
  EstadoEntrega,
  PrioridadEntrega,
} from "@/types/entrega";
import { fechaUY, usd } from "@/lib/formato";

type Props = {
  entregas: Entrega[];
  seleccionados: number[];
  onSeleccionar: (id: number) => void;
  onEditar: (pedido: Entrega) => void;
  onImprimirEtiqueta: (pedido: Entrega) => void;
  onCambiarEstadoPedido?: (
    id: number,
    estado: EstadoEntrega
  ) => void;
};

export default function TablaPedidos({
  entregas,
  seleccionados,
  onSeleccionar,
  onEditar,
  onImprimirEtiqueta,
  onCambiarEstadoPedido,
}: Props) {
  if (entregas.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-500">
        No hay pedidos para mostrar.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {entregas.map((entrega) => (
        <TarjetaPedido
          key={entrega.id}
          entrega={entrega}
          seleccionado={seleccionados.includes(entrega.id)}
          onSeleccionar={onSeleccionar}
          onEditar={onEditar}
          onImprimirEtiqueta={onImprimirEtiqueta}
          onCambiarEstadoPedido={onCambiarEstadoPedido}
        />
      ))}
    </div>
  );
}

type TarjetaPedidoProps = {
  entrega: Entrega;
  seleccionado: boolean;
  onSeleccionar: (id: number) => void;
  onEditar: (pedido: Entrega) => void;
  onImprimirEtiqueta: (pedido: Entrega) => void;
  onCambiarEstadoPedido?: (
    id: number,
    estado: EstadoEntrega
  ) => void;
};

function TarjetaPedido({
  entrega,
  seleccionado,
  onSeleccionar,
  onEditar,
  onImprimirEtiqueta,
  onCambiarEstadoPedido,
}: TarjetaPedidoProps) {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);

  const direccionCompleta = [
    entrega.direccion,
    entrega.departamento,
  ]
    .filter(Boolean)
    .join(", ");

  const urlMaps = direccionCompleta
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${direccionCompleta}, Uruguay`
      )}`
    : "";

  return (
    <article
      className={`overflow-hidden rounded-[28px] border transition-all duration-200 ${
        seleccionado
          ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
          : "border-slate-700/70 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl"
      }`}
    >
      <div className="p-5 sm:p-6">
        {/* ENCABEZADO */}
        <div className="flex items-start gap-4">
          <div className="pt-1">
            <input
              type="checkbox"
              checked={seleccionado}
              onChange={() => onSeleccionar(entrega.id)}
              className="h-6 w-6 cursor-pointer rounded-md accent-cyan-500"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="break-words text-xl font-bold leading-tight text-white sm:text-2xl">
              {entrega.cliente}
            </h3>

            <div className="mt-4 flex flex-wrap gap-2">
              <Prioridad prioridad={entrega.prioridad ?? undefined} />
              <Estado estado={entrega.estado} />
            </div>
          </div>
        </div>

        {/* DATOS PRINCIPALES */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <DatoTarjeta
            icono="📄"
            titulo="Factura"
            valor={entrega.numero_factura || "-"}
          />

          <DatoTarjeta
            icono="📅"
            titulo="Entrega"
            valor={fechaUY(
              entrega.fecha_entregado ||
                entrega.fecha_entrega_programada
            )}
          />

          <DatoTarjeta
            icono="💵"
            titulo="Monto"
            valor={usd(entrega.monto)}
          />

          <DatoTarjeta
            icono="📱"
            titulo="Teléfono"
            valor={entrega.telefono_cliente || "-"}
          />
        </div>

        {/* DIRECCIÓN */}
        <div className="mt-3">
          <DatoAncho
            icono="📍"
            titulo="Dirección"
            valor={entrega.direccion || "-"}
          />
        </div>

        {/* DEPARTAMENTO */}
        <div className="mt-3">
          <DatoAncho
            icono="🗺️"
            titulo="Departamento"
            valor={entrega.departamento || "-"}
          />
        </div>

        {/* OBSERVACIONES DEL PEDIDO */}
        {entrega.observaciones && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-slate-950">
            <div className="flex gap-3 border-l-4 border-amber-400 px-4 py-4">
              <span className="text-2xl">📝</span>

              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Observaciones
                </div>

                <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-100">
                  {entrega.observaciones}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INFORMACIÓN DE ENTREGA CONFIRMADA */}
        {entrega.estado === "entregado" && (
          <div className="mt-4 space-y-3">
            {entrega.recibido_por && (
              <DatoAncho
                icono="👤"
                titulo="Recibió"
                valor={entrega.recibido_por}
                variante="green"
              />
            )}

            {entrega.observacion_entrega && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  📝 Observación de entrega
                </div>

                <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-white">
                  {entrega.observacion_entrega}
                </div>
              </div>
            )}

            {entrega.factura_firmada_url && (
              <a
                href={entrega.factura_firmada_url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-14 items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  Ver factura firmada
                </span>

                <span className="text-xl text-emerald-300">›</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* ACCIONES PRINCIPALES */}
      <div className="space-y-3 border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5">
        <BotonAccion
          icono="✏️"
          texto="Editar"
          variante="cyan"
          onClick={() => onEditar(entrega)}
        />

        <BotonAccion
          icono="🏷️"
          texto="Etiqueta"
          variante="green"
          onClick={() => onImprimirEtiqueta(entrega)}
        />

        {entrega.telefono_cliente && (
          <a
            href={`tel:${entrega.telefono_cliente}`}
            className="flex min-h-14 items-center justify-between rounded-2xl border border-blue-400/10 bg-gradient-to-r from-blue-500/15 to-slate-800 px-5 py-3 font-semibold text-white transition active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-xl">
                📞
              </span>

              Llamar
            </span>

            <span className="text-3xl font-light text-blue-200">›</span>
          </a>
        )}

        <button
          type="button"
          onClick={() => setMostrarOpciones((actual) => !actual)}
          className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3 text-left font-semibold text-white transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700/80 text-xl">
              •••
            </span>

            Más opciones
          </span>

          <span
            className={`text-2xl text-slate-300 transition-transform ${
              mostrarOpciones ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
        </button>

        {/* OPCIONES SECUNDARIAS */}
        {mostrarOpciones && (
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            {entrega.direccion && (
              <a
                href={urlMaps}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <span>📍 Abrir en Maps</span>
                <span className="text-xl text-slate-400">›</span>
              </a>
            )}

            {onCambiarEstadoPedido &&
              entrega.estado !== "a_entregar" && (
                <button
                  type="button"
                  onClick={() =>
                    onCambiarEstadoPedido(
                      entrega.id,
                      "a_entregar"
                    )
                  }
                  className="flex min-h-12 w-full items-center justify-between rounded-xl bg-cyan-500/15 px-4 py-3 text-left text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
                >
                  <span>🚚 Pasar a reparto</span>
                  <span className="text-xl">›</span>
                </button>
              )}

            {onCambiarEstadoPedido &&
              entrega.estado !== "entregado" && (
                <button
                  type="button"
                  onClick={() =>
                    onCambiarEstadoPedido(
                      entrega.id,
                      "entregado"
                    )
                  }
                  className="flex min-h-12 w-full items-center justify-between rounded-xl bg-emerald-500/15 px-4 py-3 text-left text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
                >
                  <span>✅ Marcar como entregado</span>
                  <span className="text-xl">›</span>
                </button>
              )}

            {onCambiarEstadoPedido &&
              entrega.estado !== "pendiente" && (
                <button
                  type="button"
                  onClick={() =>
                    onCambiarEstadoPedido(
                      entrega.id,
                      "pendiente"
                    )
                  }
                  className="flex min-h-12 w-full items-center justify-between rounded-xl bg-amber-500/15 px-4 py-3 text-left text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
                >
                  <span>📦 Volver a depósito</span>
                  <span className="text-xl">›</span>
                </button>
              )}

            {onCambiarEstadoPedido &&
              entrega.estado !== "papelera" && (
                <button
                  type="button"
                  onClick={() =>
                    onCambiarEstadoPedido(
                      entrega.id,
                      "papelera"
                    )
                  }
                  className="flex min-h-12 w-full items-center justify-between rounded-xl bg-red-500/15 px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/25"
                >
                  <span>🗑️ Enviar a papelera</span>
                  <span className="text-xl">›</span>
                </button>
              )}
          </div>
        )}
      </div>
    </article>
  );
}

function DatoTarjeta({
  icono,
  titulo,
  valor,
}: {
  icono: string;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-700/70 bg-slate-900/70 px-3 py-4 sm:px-4">
      <div className="flex items-start gap-3">
        <span className="text-xl sm:text-2xl">{icono}</span>

        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
            {titulo}
          </div>

          <div className="mt-1 break-words text-sm font-semibold text-slate-100 sm:text-base">
            {valor}
          </div>
        </div>
      </div>
    </div>
  );
}

function DatoAncho({
  icono,
  titulo,
  valor,
  variante = "slate",
}: {
  icono: string;
  titulo: string;
  valor: string;
  variante?: "slate" | "green";
}) {
  const clase =
    variante === "green"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : "border-slate-700/70 bg-slate-900/70";

  return (
    <div className={`rounded-2xl border px-4 py-4 ${clase}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icono}</span>

        <div className="min-w-0">
          <div
            className={`text-xs font-semibold uppercase tracking-wider ${
              variante === "green"
                ? "text-emerald-300"
                : "text-cyan-300"
            }`}
          >
            {titulo}
          </div>

          <div className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-slate-100 sm:text-base">
            {valor}
          </div>
        </div>
      </div>
    </div>
  );
}

function BotonAccion({
  icono,
  texto,
  variante,
  onClick,
}: {
  icono: string;
  texto: string;
  variante: "cyan" | "green";
  onClick: () => void;
}) {
  const clase =
    variante === "cyan"
      ? "border-cyan-400/10 bg-gradient-to-r from-cyan-500/20 to-slate-800"
      : "border-emerald-400/10 bg-gradient-to-r from-emerald-500/20 to-slate-800";

  const iconoClase =
    variante === "cyan"
      ? "bg-cyan-500/15"
      : "bg-emerald-500/15";

  const flechaClase =
    variante === "cyan"
      ? "text-cyan-300"
      : "text-emerald-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 w-full items-center justify-between rounded-2xl border px-5 py-3 text-left font-semibold text-white transition active:scale-[0.99] ${clase}`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl ${iconoClase}`}
        >
          {icono}
        </span>

        {texto}
      </span>

      <span className={`text-3xl font-light ${flechaClase}`}>
        ›
      </span>
    </button>
  );
}

function Prioridad({
  prioridad,
}: {
  prioridad?: PrioridadEntrega | null;
}) {
  if (prioridad === "critico") {
    return (
      <span className="rounded-full border border-red-400/30 bg-red-500/20 px-4 py-2 text-xs font-bold text-red-200">
        🔴 CRÍTICO
      </span>
    );
  }

  if (prioridad === "urgente") {
    return (
      <span className="rounded-full border border-yellow-400/30 bg-yellow-500/20 px-4 py-2 text-xs font-bold text-yellow-200">
        🟡 URGENTE
      </span>
    );
  }

  return (
    <span className="rounded-full border border-slate-500/30 bg-slate-700/80 px-4 py-2 text-xs font-bold text-white">
      ⚪ NORMAL
    </span>
  );
}

function Estado({
  estado,
}: {
  estado?: EstadoEntrega | null;
}) {
  if (estado === "a_entregar") {
    return (
      <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-xs font-bold text-cyan-200">
        🚚 REPARTO
      </span>
    );
  }

  if (estado === "entregado") {
    return (
      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-200">
        ✅ ENTREGADO
      </span>
    );
  }

  if (estado === "papelera") {
    return (
      <span className="rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-xs font-bold text-red-200">
        🗑 PAPELERA
      </span>
    );
  }

  return (
    <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200">
      📦 DEPÓSITO
    </span>
  );
}