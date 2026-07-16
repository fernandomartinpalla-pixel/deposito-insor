"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const params = useParams();
  const token = params?.token as string;

  const [mensaje, setMensaje] = useState("Registrando entrega...");

  useEffect(() => {
    async function registrarEntrega() {
      if (!token) {
        setMensaje("❌ Token no encontrado");
        return;
      }

      const ahora = new Date().toISOString();

      const { error } = await supabase
        .from("entregas")
        .update({
          estado: "entregado",
          fecha_entregado: ahora,
          fecha_entregado_real: ahora,
          fecha_qr_entregado: ahora,
        })
        .eq("qr_token", token);

      if (error) {
        console.error("Error QR:", error);
        setMensaje(`❌ ${error.message}`);
        return;
      }

      setMensaje("✅ Pedido entregado correctamente");
    }

    registrarEntrega();
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl mb-6">📦</div>

        <h1 className="text-3xl font-bold text-white mb-4">
          {mensaje}
        </h1>

        <p className="text-slate-400 mb-8">
          Ya podés cerrar esta pantalla.
        </p>

        <button
          onClick={() => window.close()}
          className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 transition"
        >
          Cerrar
        </button>
      </div>
    </main>
  );
}