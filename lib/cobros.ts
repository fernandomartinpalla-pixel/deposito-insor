import { supabase } from "@/lib/supabase";
import type { Cobro, EstadoCobro, MonedaCobro } from "../types/cobro";

const BUCKET_RECIBOS = "recibos-cobros";

export async function cargarCobros(): Promise<Cobro[]> {
  const { data, error } = await supabase
    .from("cobros")
    .select("*")
    .order("fecha_programada", { ascending: true })
    .order("id", { ascending: false });

  if (error) throw error;
  return (data || []) as Cobro[];
}

export async function guardarCobro(params: {
  clienteId?: number | null;
  cliente: string;
  direccion?: string;
  departamento?: string;
  telefono?: string;
  factura?: string;
  moneda: MonedaCobro;
  monto: string;
  fechaProgramada: string;
  responsable?: string;
  observaciones?: string;
}) {
  const { error } = await supabase.from("cobros").insert([{
    cliente_id: params.clienteId ?? null,
    cliente: params.cliente.trim(),
    direccion: params.direccion?.trim() || null,
    departamento: params.departamento?.trim() || null,
    telefono: params.telefono?.trim() || null,
    factura: params.factura?.trim() || null,
    moneda: params.moneda,
    monto: Number(params.monto),
    fecha_programada: params.fechaProgramada,
    estado: "pendiente",
    responsable: params.responsable?.trim() || null,
    observaciones: params.observaciones?.trim() || null,
  }]);

  if (error) throw error;
}

export async function actualizarCobro(params: {
  id: number;
  clienteId?: number | null;
  cliente: string;
  direccion?: string;
  departamento?: string;
  telefono?: string;
  factura?: string;
  moneda: MonedaCobro;
  monto: string;
  fechaProgramada: string;
  responsable?: string;
  observaciones?: string;
}) {
  const { error } = await supabase
    .from("cobros")
    .update({
      cliente_id: params.clienteId ?? null,
      cliente: params.cliente.trim(),
      direccion: params.direccion?.trim() || null,
      departamento: params.departamento?.trim() || null,
      telefono: params.telefono?.trim() || null,
      factura: params.factura?.trim() || null,
      moneda: params.moneda,
      monto: Number(params.monto),
      fecha_programada: params.fechaProgramada,
      responsable: params.responsable?.trim() || null,
      observaciones: params.observaciones?.trim() || null,
    })
    .eq("id", params.id);

  if (error) throw error;
}

export async function subirReciboCobro(
  cobroId: number,
  archivo: File
): Promise<string> {
  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const nombreArchivo = `${cobroId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: errorSubida } = await supabase.storage
    .from(BUCKET_RECIBOS)
    .upload(nombreArchivo, archivo, {
      cacheControl: "3600",
      contentType: archivo.type || "image/jpeg",
      upsert: false,
    });

  if (errorSubida) throw errorSubida;

  const { data } = supabase.storage
    .from(BUCKET_RECIBOS)
    .getPublicUrl(nombreArchivo);

  if (!data.publicUrl) {
    throw new Error("No se pudo obtener la dirección del recibo.");
  }

  return data.publicUrl;
}

export async function cambiarEstadoCobro(
  id: number,
  estado: EstadoCobro,
  formaCobro?: string,
  reciboUrl?: string
) {
  const cambios: Record<string, unknown> = { estado };

  if (estado === "cobrado") {
    cambios.fecha_cobrado = new Date().toISOString();
    cambios.forma_cobro = formaCobro || null;

    if (reciboUrl) {
      cambios.recibo_url = reciboUrl;
    }
  } else {
    cambios.fecha_cobrado = null;
    cambios.forma_cobro = null;

    if (estado === "pendiente") {
      cambios.recibo_url = null;
    }
  }

  const { error } = await supabase
    .from("cobros")
    .update(cambios)
    .eq("id", id);

  if (error) throw error;
}

export async function eliminarCobro(id: number) {
  const { error } = await supabase
    .from("cobros")
    .delete()
    .eq("id", id);

  if (error) throw error;
}