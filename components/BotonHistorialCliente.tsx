"use client";

import { useRouter } from "next/navigation";

type Props = {
  clienteId?: number | null;
  className?: string;
  texto?: string;
};

export default function BotonHistorialCliente({
  clienteId,
  className = "",
  texto = "Historial",
}: Props) {
  const router = useRouter();
  const habilitado = typeof clienteId === "number" && clienteId > 0;

  return (
    <button
      type="button"
      disabled={!habilitado}
      onClick={() => habilitado && router.push(`/clientes/${clienteId}/historial`)}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
        habilitado
          ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
      } ${className}`}
    >
      {texto}
    </button>
  );
}
