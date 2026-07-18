"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Entrega = {
  id: number;
  cliente?: string | null;
  numero_factura?: string | null;
  estado?: string | null;
  recibido_por?: string | null;
  factura_firmada_url?: string | null;
};

export default function Page() {
  const params = useParams();
  const token = params?.token as string;

  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [recibidoPor, setRecibidoPor] = useState("");
  const [observacion, setObservacion] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarEntrega();
  }, [token]);

  async function cargarEntrega() {
    if (!token) {
      setMensaje("❌ Token no encontrado");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const { data, error } = await supabase
        .from("entregas")
        .select("id, cliente, numero_factura, estado, recibido_por, factura_firmada_url")
        .eq("qr_token", token)
        .single();

      if (error) throw error;

      setEntrega(data as Entrega);

      if (data.estado === "entregado") {
        setRecibidoPor(data.recibido_por || "");
      }
    } catch (error: any) {
      console.error("Error al cargar entrega:", error);
      setMensaje(error.message || "No se pudo encontrar la entrega.");
    } finally {
      setCargando(false);
    }
  }

  async function confirmarEntrega() {
    if (!entrega) return;

    if (!recibidoPor.trim()) {
      setMensaje("Ingresá el nombre de la persona que recibe.");
      return;
    }

    if (!foto) {
      setMensaje("Tenés que sacar una foto de la factura firmada.");
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const archivoComprimido = await comprimirImagen(foto);
      const nombreArchivo = `${entrega.id}/${Date.now()}-${crypto.randomUUID()}.jpg`;

      const { error: errorSubida } = await supabase.storage
        .from("facturas-firmadas")
        .upload(nombreArchivo, archivoComprimido, {
          cacheControl: "3600",
          contentType: "image/jpeg",
          upsert: false,
        });

      if (errorSubida) throw errorSubida;

      const { data: urlData } = supabase.storage
        .from("facturas-firmadas")
        .getPublicUrl(nombreArchivo);

      const ahora = new Date().toISOString();

      const { error: errorEntrega } = await supabase
        .from("entregas")
        .update({
          estado: "entregado",
          fecha_entregado: ahora,
          fecha_entregado_real: ahora,
          fecha_qr_entregado: ahora,
          recibido_por: recibidoPor.trim(),
          factura_firmada_url: urlData.publicUrl,
          observacion_entrega: observacion.trim() || null,
        })
        .eq("qr_token", token);

      if (errorEntrega) throw errorEntrega;

      setEntrega({
        ...entrega,
        estado: "entregado",
        recibido_por: recibidoPor.trim(),
        factura_firmada_url: urlData.publicUrl,
      });

      setMensaje("✅ Pedido entregado correctamente");
    } catch (error: any) {
      console.error("Error al confirmar entrega:", error);
      setMensaje(error.message || "No se pudo confirmar la entrega.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <PantallaEstado icono="⏳" titulo="Cargando entrega..." detalle="Aguardá unos segundos." />;
  }

  if (!entrega) {
    return <PantallaEstado icono="❌" titulo="Entrega no encontrada" detalle={mensaje || "El código QR no es válido."} />;
  }

  if (entrega.estado === "entregado") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-slate-900 p-7 text-center shadow-2xl">
          <div className="mb-5 text-6xl">✅</div>
          <h1 className="text-3xl font-black text-white">Pedido entregado</h1>
          <p className="mt-3 text-slate-400">{entrega.cliente || "Cliente"}</p>

          {entrega.recibido_por && (
            <p className="mt-2 font-bold text-emerald-200">Recibió: {entrega.recibido_por}</p>
          )}

          {entrega.factura_firmada_url && (
            <a
              href={entrega.factura_firmada_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 block w-full rounded-2xl border border-cyan-500/30 bg-cyan-500/10 py-4 font-black text-cyan-200"
            >
              📄 Ver factura firmada
            </a>
          )}

          <button
            type="button"
            onClick={() => window.close()}
            className="mt-3 w-full rounded-2xl bg-slate-800 py-4 font-bold text-white"
          >
            Cerrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto max-w-lg py-6">
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
          <div className="text-center">
            <div className="text-6xl">📦</div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-cyan-400">INSOR ENTREGAS</p>
            <h1 className="mt-2 text-3xl font-black">Confirmar entrega</h1>
            <p className="mt-3 text-slate-400">{entrega.cliente || "Cliente"}</p>

            {entrega.numero_factura && (
              <p className="mt-1 text-sm font-bold text-slate-300">Factura: {entrega.numero_factura}</p>
            )}
          </div>

          {mensaje && (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100">
              {mensaje}
            </div>
          )}

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Nombre de quien recibe *</span>
              <input
                value={recibidoPor}
                onChange={(event) => setRecibidoPor(event.target.value)}
                placeholder="Ejemplo: Juan Pérez"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-600 bg-slate-950 p-6 text-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  setFoto(event.target.files?.[0] || null);
                  setMensaje("");
                }}
              />

              <div className="text-5xl">📷</div>
              <p className="mt-3 font-black">Sacar foto de la factura firmada</p>
              <p className="mt-1 text-sm text-slate-400">También podés elegir una foto de la galería.</p>
            </label>

            {foto && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="font-bold text-emerald-200">✓ Foto seleccionada</p>
                <p className="mt-1 truncate text-sm text-slate-300">{foto.name}</p>
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Observación de la entrega</span>
              <textarea
                value={observacion}
                onChange={(event) => setObservacion(event.target.value)}
                rows={3}
                placeholder="Opcional"
                className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-400"
              />
            </label>

            <button
              type="button"
              onClick={confirmarEntrega}
              disabled={guardando || !recibidoPor.trim() || !foto}
              className="w-full rounded-2xl bg-cyan-500 py-4 text-lg font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? "Guardando entrega..." : "✓ Confirmar entrega"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function PantallaEstado({ icono, titulo, detalle }: { icono: string; titulo: string; detalle: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mb-6 text-6xl">{icono}</div>
        <h1 className="text-3xl font-black text-white">{titulo}</h1>
        <p className="mt-4 text-slate-400">{detalle}</p>
      </div>
    </main>
  );
}

async function comprimirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const imagen = await cargarImagen(archivo);
  const anchoMaximo = 1600;
  const escala = Math.min(1, anchoMaximo / imagen.width);
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("No se pudo procesar la imagen.");

  contexto.drawImage(imagen, 0, 0, ancho, alto);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resultado) => resultado ? resolve(resultado) : reject(new Error("No se pudo comprimir la imagen.")),
      "image/jpeg",
      0.8
    );
  });

  return new File([blob], `factura-${Date.now()}.jpg`, { type: "image/jpeg" });
}

function cargarImagen(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();

    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagen);
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };

    imagen.src = url;
  });
}