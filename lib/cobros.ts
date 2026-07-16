import { supabase } from "@/lib/supabase";
import type { Cobro, EstadoCobro, MonedaCobro } from "../types/cobro";

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

export async function cambiarEstadoCobro(
  id: number,
  estado: EstadoCobro,
  formaCobro?: string
) {
  const cambios: Partial<Cobro> = { estado };

  if (estado === "cobrado") {
    cambios.fecha_cobrado = new Date().toISOString();
    cambios.forma_cobro = formaCobro || null;
  } else {
    cambios.fecha_cobrado = null;
    cambios.forma_cobro = null;
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
