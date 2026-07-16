import { supabase } from "@/lib/supabase";
import type {
  EstadoVisita,
  PrioridadVisita,
  Visita,
} from "@/types/visita";

export async function cargarVisitas(): Promise<Visita[]> {
  const { data, error } = await supabase
    .from("visitas")
    .select("*")
    .order("fecha_programada", { ascending: true })
    .order("hora_programada", { ascending: true })
    .order("id", { ascending: false });

  if (error) throw error;

  return (data || []) as Visita[];
}

export async function guardarVisita(params: {
  clienteId?: number | null;
  cliente: string;
  direccion?: string;
  departamento?: string;
  telefono?: string;
  fechaProgramada: string;
  horaProgramada?: string;
  motivo?: string;
  prioridad: PrioridadVisita;
  responsable?: string;
  observaciones?: string;
}) {
  const { error } = await supabase.from("visitas").insert([
    {
      cliente_id: params.clienteId ?? null,
      cliente: params.cliente.trim(),
      direccion: params.direccion?.trim() || null,
      departamento: params.departamento?.trim() || null,
      telefono: params.telefono?.trim() || null,
      fecha_programada: params.fechaProgramada,
      hora_programada: params.horaProgramada || null,
      motivo: params.motivo?.trim() || null,
      prioridad: params.prioridad,
      estado: "pendiente",
      responsable: params.responsable?.trim() || null,
      observaciones: params.observaciones?.trim() || null,
    },
  ]);

  if (error) throw error;
}

export async function cambiarEstadoVisita(params: {
  id: number;
  estado: EstadoVisita;
  resultado?: string;
  proximaVisita?: string;
}) {
  const cambios: Partial<Visita> = {
    estado: params.estado,
    resultado: params.resultado?.trim() || null,
    proxima_visita: params.proximaVisita || null,
  };

  if (params.estado === "realizada") {
    cambios.fecha_realizada = new Date().toISOString();
  } else {
    cambios.fecha_realizada = null;
  }

  const { error } = await supabase
    .from("visitas")
    .update(cambios)
    .eq("id", params.id);

  if (error) throw error;
}

export async function eliminarVisita(id: number) {
  const { error } = await supabase
    .from("visitas")
    .delete()
    .eq("id", id);

  if (error) throw error;
}