"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Page({
  params,
}: {
  params: { token: string };
}) {
  const [mensaje, setMensaje] =
    useState("Registrando entrega...");

  useEffect(() => {
    async function entregar() {
      const { error } =
        await supabase
          .from("entregas")
.update({
  estado: "entregado",
  fecha_entregado: new Date().toISOString(),
  fecha_entregado_real: new Date().toISOString(),
  fecha_qr_entregado: new Date().toISOString(),
})
          .eq("qr_token",params.token
          );

      if (error) {
        setMensaje("Error registrando entrega");
        return;
      }

      setMensaje(
        "✅ Entrega confirmada"
      );
    }

    entregar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">
          📦
        </div>

        <h1 className="text-3xl font-bold">
          {mensaje}
        </h1>
      </div>
    </main>
  );
}