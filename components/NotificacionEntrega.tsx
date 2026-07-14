"use client";

import { useEffect, useState } from "react";

type Props = {
  visible: boolean;
  pedidoId?: number | null;
  cliente?: string | null;
  onCerrar?: () => void;
};

export default function NotificacionEntrega({
  visible,
  pedidoId,
  cliente,
  onCerrar,
}: Props) {
  const [mostrar, setMostrar] = useState(visible);
  const [completado, setCompletado] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMostrar(false);
      setCompletado(false);
      return;
    }

    setMostrar(true);
    setCompletado(false);

    const timerCamion = window.setTimeout(() => {
      setCompletado(true);
    }, 1400);

    const timerCerrar = window.setTimeout(() => {
      setMostrar(false);
      onCerrar?.();
    }, 6000);

    return () => {
      window.clearTimeout(timerCamion);
      window.clearTimeout(timerCerrar);
    };
  }, [visible, pedidoId, cliente, onCerrar]);

  if (!mostrar) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-md animate-[entradaEntrega_.35s_ease-out]">
      <div
        className={`overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-500 ${
          completado
            ? "border-emerald-400 bg-emerald-950/95"
            : "border-cyan-400 bg-slate-950/95"
        }`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className={`text-xs font-black uppercase tracking-[0.22em] ${
                  completado ? "text-emerald-300" : "text-cyan-300"
                }`}
              >
                {completado ? "Entrega confirmada" : "Registrando entrega"}
              </p>

              <h3 className="mt-2 text-2xl font-black text-white">
                Pedido #{pedidoId ?? "-"}
              </h3>

              <p className="mt-1 text-sm text-slate-300">
                {cliente || "Cliente sin nombre"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMostrar(false);
                onCerrar?.();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>

          <div className="relative mt-6 h-16 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
            <div className="absolute left-5 right-5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />

            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
              📦
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
              🏠
            </div>

            <div
              className={`absolute top-1/2 -translate-y-1/2 text-3xl transition-all duration-[1300ms] ease-in-out ${
                completado ? "left-[78%]" : "left-[16%]"
              }`}
            >
              🚚
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full text-xl font-black transition-all duration-500 ${
                completado
                  ? "scale-100 bg-emerald-400 text-emerald-950"
                  : "scale-90 bg-cyan-400/20 text-cyan-200"
              }`}
            >
              {completado ? "✓" : "…"}
            </div>

            <div>
              <p className="font-bold text-white">
                {completado
                  ? "El pedido fue movido al historial."
                  : "Estamos actualizando el estado del pedido."}
              </p>

              <p className="text-sm text-slate-400">
                Esta notificación se cerrará automáticamente.
              </p>
            </div>
          </div>
        </div>

        <div className="h-1 bg-white/10">
          <div
            className={`h-full transition-all duration-[5500ms] ease-linear ${
              completado ? "w-full bg-emerald-400" : "w-1/4 bg-cyan-400"
            }`}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes entradaEntrega {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}