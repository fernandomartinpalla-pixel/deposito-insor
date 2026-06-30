"use client";

import FormularioPedido from "./FormularioPedido";
import type { Cliente } from "@/types/cliente";
import type { PrioridadEntrega } from "@/types/entrega";

type Props = {
  abierto: boolean;
  onCerrar: () => void;

  clientes: Cliente[];

  cliente: string;
  fechaPedido: string;
  fechaEntrega: string;
  factura: string;
  monto: string;
  observaciones: string;
  prioridad: PrioridadEntrega;
  telefono: string;
  direccion: string;
  departamento: string;

  onClienteChange: (valor: string) => void;
  setFechaPedido: (valor: string) => void;
  setFechaEntrega: (valor: string) => void;
  setFactura: (valor: string) => void;
  setMonto: (valor: string) => void;
  setObservaciones: (valor: string) => void;
  setPrioridad: (valor: PrioridadEntrega) => void;
  setTelefono: (valor: string) => void;
  setDireccion: (valor: string) => void;
  setDepartamento: (valor: string) => void;

  onGuardar: () => void;
};

export default function PanelNuevoPedido({
  abierto,
  onCerrar,
  clientes,
  cliente,
  fechaPedido,
  fechaEntrega,
  factura,
  monto,
  observaciones,
  prioridad,
  telefono,
  direccion,
  departamento,
  onClienteChange,
  setFechaPedido,
  setFechaEntrega,
  setFactura,
  setMonto,
  setObservaciones,
  setPrioridad,
  setTelefono,
  setDireccion,
  setDepartamento,
  onGuardar,
}: Props) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl overflow-auto border-l border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-400">
              Nuevo pedido
            </p>
            <h2 className="mt-2 text-3xl font-black">Cargar entrega</h2>
          </div>

          <button
            onClick={onCerrar}
            className="rounded-2xl bg-slate-800 px-5 py-3 font-semibold hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>

        <FormularioPedido
          clientes={clientes}
          cliente={cliente}
          fechaPedido={fechaPedido}
          fechaEntrega={fechaEntrega}
          factura={factura}
          monto={monto}
          observaciones={observaciones}
          prioridad={prioridad}
          telefono={telefono}
          direccion={direccion}
          departamento={departamento}
          onClienteChange={onClienteChange}
          setFechaPedido={setFechaPedido}
          setFechaEntrega={setFechaEntrega}
          setFactura={setFactura}
          setMonto={setMonto}
          setObservaciones={setObservaciones}
          setPrioridad={setPrioridad}
          setTelefono={setTelefono}
          setDireccion={setDireccion}
          setDepartamento={setDepartamento}
          onGuardar={onGuardar}
        />
      </div>
    </div>
  );
}