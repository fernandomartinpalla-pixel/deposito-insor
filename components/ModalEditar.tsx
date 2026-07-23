"use client";

import { useEffect, useState } from "react";
import type {
  Entrega,
  TipoEntrega,
} from "@/types/entrega";

type ModalEditarProps = {
  abierto: boolean;
  entrega: Entrega | null;
  onCerrar: () => void;
  onGuardar: (entregaActualizada: Entrega) => void | Promise<void>;
};

export default function ModalEditar({
  abierto,
  entrega,
  onCerrar,
  onGuardar,
}: ModalEditarProps) {
  const [formulario, setFormulario] = useState<Entrega | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!entrega) {
      setFormulario(null);
      return;
    }

    setFormulario({
      ...entrega,
      tipo_entrega: entrega.tipo_entrega || "domicilio",
    });
  }, [entrega]);

  if (!abierto || !formulario) return null;

  const tipoEntrega: TipoEntrega =
    formulario.tipo_entrega || "domicilio";

  const esRetiro = tipoEntrega === "retiro";

  function cambiarCampo(
    campo: keyof Entrega,
    valor: string | number | null
  ) {
    setFormulario((actual) => {
      if (!actual) return actual;

      return {
        ...actual,
        [campo]: campo === "monto" ? Number(valor) : valor,
      };
    });
  }

  function cambiarTipoEntrega(nuevoTipo: TipoEntrega) {
    setFormulario((actual) => {
      if (!actual) return actual;

      if (nuevoTipo === "retiro") {
        return {
          ...actual,
          tipo_entrega: "retiro",
          fecha_entrega_programada: null,
        };
      }

      return {
        ...actual,
        tipo_entrega: "domicilio",
        fecha_entrega_programada:
          actual.fecha_entrega_programada ||
          new Date().toISOString().slice(0, 10),
      };
    });
  }

  async function guardarCambios() {
    if (!formulario || guardando) return;

    if (!formulario.cliente.trim()) {
      alert("Ingresá el cliente.");
      return;
    }

    if (!formulario.numero_factura.trim()) {
      alert("Ingresá el número de factura.");
      return;
    }

    if (
      formulario.tipo_entrega === "domicilio" &&
      !formulario.fecha_entrega_programada
    ) {
      alert("Ingresá la fecha de entrega.");
      return;
    }

    try {
      setGuardando(true);

      await onGuardar({
        ...formulario,
        tipo_entrega: formulario.tipo_entrega || "domicilio",
        fecha_entrega_programada:
          formulario.tipo_entrega === "retiro"
            ? null
            : formulario.fecha_entrega_programada,
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-6">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">✏️ Editar pedido</h2>

            <p className="text-sm text-slate-400">
              Factura {formulario.numero_factura}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-slate-300">
            Tipo de pedido
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => cambiarTipoEntrega("domicilio")}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                tipoEntrega === "domicilio"
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              <span className="block text-lg font-bold">
                🚚 Entrega a domicilio
              </span>

              <span className="mt-1 block text-sm text-slate-400">
                El pedido se enviará a la dirección del cliente.
              </span>
            </button>

            <button
              type="button"
              onClick={() => cambiarTipoEntrega("retiro")}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                tipoEntrega === "retiro"
                  ? "border-amber-400 bg-amber-500/20 text-amber-100"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              <span className="block text-lg font-bold">
                🏪 Retira el cliente
              </span>

              <span className="mt-1 block text-sm text-slate-400">
                El pedido queda en depósito hasta que lo retiren.
              </span>
            </button>
          </div>
        </div>

        {esRetiro && (
          <div className="mb-5 rounded-2xl border border-amber-500/50 bg-amber-500/10 px-5 py-4 text-amber-100">
            <p className="font-bold">🏪 Pedido para retirar</p>

            <p className="mt-1 text-sm text-amber-100/80">
              Se quitará la fecha de entrega programada y este pedido no
              deberá considerarse vencido.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Campo etiqueta="Cliente">
            <Input
              value={formulario.cliente || ""}
              onChange={(valor) => cambiarCampo("cliente", valor)}
              placeholder="Cliente"
            />
          </Campo>

          <Campo etiqueta="Factura">
            <Input
              value={formulario.numero_factura || ""}
              onChange={(valor) =>
                cambiarCampo("numero_factura", valor)
              }
              placeholder="Factura"
            />
          </Campo>

          <Campo etiqueta="Monto USD">
            <Input
              type="number"
              value={String(formulario.monto ?? "")}
              onChange={(valor) => cambiarCampo("monto", valor)}
              placeholder="Monto USD"
            />
          </Campo>

          <Campo etiqueta="Fecha del pedido">
            <Input
              type="date"
              value={formulario.fecha_pedido || ""}
              onChange={(valor) =>
                cambiarCampo("fecha_pedido", valor || null)
              }
            />
          </Campo>

          {!esRetiro && (
            <Campo etiqueta="Fecha de entrega">
              <Input
                type="date"
                value={formulario.fecha_entrega_programada || ""}
                onChange={(valor) =>
                  cambiarCampo(
                    "fecha_entrega_programada",
                    valor || null
                  )
                }
              />
            </Campo>
          )}

          <Campo etiqueta="Prioridad">
            <select
              value={formulario.prioridad || "normal"}
              onChange={(e) =>
                cambiarCampo("prioridad", e.target.value)
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4"
            >
              <option value="normal">Prioridad normal</option>
              <option value="urgente">Urgente</option>
              <option value="critico">Crítico</option>
            </select>
          </Campo>

          <Campo etiqueta="Teléfono">
            <Input
              value={formulario.telefono_cliente || ""}
              onChange={(valor) =>
                cambiarCampo("telefono_cliente", valor)
              }
              placeholder="Teléfono"
            />
          </Campo>

          <Campo
            etiqueta={
              esRetiro
                ? "Dirección del cliente (opcional)"
                : "Dirección de entrega"
            }
          >
            <Input
              value={formulario.direccion || ""}
              onChange={(valor) =>
                cambiarCampo("direccion", valor)
              }
              placeholder={
                esRetiro
                  ? "Dirección opcional"
                  : "Dirección de entrega"
              }
            />
          </Campo>

          <Campo etiqueta="Departamento">
            <Input
              value={formulario.departamento || ""}
              onChange={(valor) =>
                cambiarCampo("departamento", valor)
              }
              placeholder="Departamento"
            />
          </Campo>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Observaciones
          </label>

          <textarea
            value={formulario.observaciones || ""}
            onChange={(e) =>
              cambiarCampo("observaciones", e.target.value)
            }
            placeholder="Observaciones"
            className="h-32 w-full rounded-2xl border border-slate-700 bg-slate-950 p-5"
          />
        </div>

        <button
          type="button"
          onClick={guardarCambios}
          disabled={guardando}
          className="mt-5 rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-300">
        {etiqueta}
      </label>

      {children}
    </div>
  );
}

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder?: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4"
    />
  );
}