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
      const ahora = new Date().toISOString();

      const { error } = await supabase
        .from("entregas")
        .update({
          estado: "entregado",
          fecha_entregado: ahora,
          fecha_entregado_real: ahora,
          fecha_qr_entregado: ahora,
        })
        .eq("qr_token", params.token);

      if (error) {
        console.error("Error QR:", error);
        setMensaje("❌ No se pudo registrar la entrega");
        return;
      }

      setMensaje("✅ Pedido entregado correctamente");

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }

    registrarEntrega();
  }, [params.token]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl mb-6">📦</div>

        <h1 className="text-3xl font-bold mb-4">{mensaje}</h1>

        <p className="text-slate-400 mb-8">
          Esta pantalla vuelve sola al sistema.
        </p>

        <button
          onClick={() => (window.location.href = "/")}
          className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 transition"
        >
          Volver
        </button>
      </div>
    </main>
  );
}