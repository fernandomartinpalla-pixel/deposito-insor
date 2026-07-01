"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Page({
  params,
}: {
  params: { token: string };
}) {
  const [mensaje, setMensaje] = useState("Registrando entrega...");
  const router = useRouter();
  useEffect(() => {
    async function registrarEntrega() {
      const { error } = await supabase
        .from("entregas")
        .update({
          estado: "entregado",
          fecha_entregado: new Date().toISOString(),
          fecha_entregado_real: new Date().toISOString(),
          fecha_qr_entregado: new Date().toISOString(),
        })
        .eq("qr_token", params.token);

      if (error) {
        setMensaje("❌ Error registrando la entrega");
        return;
      }

      setMensaje("✅ Pedido entregado correctamente");
    }
setTimeout(() => {
  router.push("/");
}, 2000);
    registrarEntrega();
  }, [params.token]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">

        <div className="text-6xl mb-6">
          📦
        </div>

        <h1 className="text-3xl font-bold mb-4">
          {mensaje}
        </h1>

        <p className="text-slate-400 mb-8">
          Si la entrega fue registrada correctamente, ya podés cerrar esta pantalla.
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