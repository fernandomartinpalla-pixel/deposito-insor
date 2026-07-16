"use client";

import { useEffect, useState } from "react";
import type { Entrega } from "@/types/entrega";

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

  useEffect(() => {
    if (entrega) setFormulario(entrega);
  }, [entrega]);

  if (!abierto || !formulario) return null;

  function cambiarCampo(campo: keyof Entrega, valor: string) {
    setFormulario((actual) => {
      if (!actual) return actual;

      return {
        ...actual,
        [campo]: campo === "monto" ? Number(valor) : valor,
      };
    });
  }

  async function guardarCambios() {
    if (!formulario) return;
    await onGuardar(formulario);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">✏️ Editar pedido</h2>
            <p className="text-sm text-slate-400">
              Factura {formulario.numero_factura}
            </p>
          </div>

          <button
            onClick={onCerrar}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Input
            value={formulario.cliente || ""}
            onChange={(v) => cambiarCampo("cliente", v)}
            placeholder="Cliente"
          />

          <Input
            value={formulario.numero_factura || ""}
            onChange={(v) => cambiarCampo("numero_factura", v)}
            placeholder="Factura"
          />

          <Input
            type="number"
            value={String(formulario.monto ?? "")}
            onChange={(v) => cambiarCampo("monto", v)}
            placeholder="Monto USD"
          />

          <Input
            type="date"
            value={formulario.fecha_pedido || ""}
            onChange={(v) => cambiarCampo("fecha_pedido", v)}
            placeholder="Fecha pedido"
          />

          <Input
            type="date"
            value={
              formulario.fecha_entrega_programada ||
              formulario.fecha_entregado ||
              ""
            }
            onChange={(v) => cambiarCampo("fecha_entrega_programada", v)}
            placeholder="Fecha entrega"
          />

          <select
            value={formulario.prioridad || "normal"}
            onChange={(e) => cambiarCampo("prioridad", e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4"
          >
            <option value="normal">Prioridad normal</option>
            <option value="urgente">Urgente</option>
            <option value="critico">Crítico</option>
          </select>

          <Input
            value={formulario.telefono_cliente || ""}
            onChange={(v) => cambiarCampo("telefono_cliente", v)}
            placeholder="Teléfono"
          />

          <Input
            value={formulario.direccion || ""}
            onChange={(v) => cambiarCampo("direccion", v)}
            placeholder="Dirección"
          />

          <Input
            value={formulario.departamento || ""}
            onChange={(v) => cambiarCampo("departamento", v)}
            placeholder="Departamento"
          />
        </div>

        <textarea
          value={formulario.observaciones || ""}
          onChange={(e) => cambiarCampo("observaciones", e.target.value)}
          placeholder="Observaciones"
          className="mt-5 h-32 w-full rounded-2xl border border-slate-700 bg-slate-950 p-5"
        />

        <button
          onClick={guardarCambios}
          className="mt-5 rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-black hover:bg-emerald-400"
        >
          Guardar cambios
        </button>
      </div>
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
  onChange: (v: string) => void;
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