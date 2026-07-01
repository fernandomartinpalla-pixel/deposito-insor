"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Page({
  params,
}: {
  params: { token: string };
}) {
  const [mensaje, setMensaje] = useState("Registrando entrega...");

  useEffect(() => {
    async function registrarEntrega() {
      const { data, error } = await supabase.rpc(
        "confirmar_entrega_por_qr",
        {
          p_token: params.token,
        }
      );

      if (error) {
        console.error("Error QR:", error);
        setMensaje("❌ No se pudo registrar la entrega");
        return;
      }

      if (!data) {
        setMensaje("❌ No se encontró el pedido");
        return;
      }

      setMensaje(`✅ Pedido #${data} entregado correctamente`);
    }

    registrarEntrega();
  }, [params.token]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl mb-6">📦</div>

        <h1 className="text-3xl font-bold mb-4">{mensaje}</h1>

        <p className="text-slate-400 mb-8">
          Ya podés cerrar esta pantalla.
        </p>
      </div>
    </main>
  );
}