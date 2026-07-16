export type EstadoVisita =
  | "pendiente"
  | "realizada"
  | "no_encontrado"
  | "reprogramada"
  | "cancelada";

export type PrioridadVisita = "normal" | "alta" | "urgente";

export type Visita = {
  id: number;
  cliente_id?: number | null;
  cliente: string;
  direccion?: string | null;
  departamento?: string | null;
  telefono?: string | null;
  fecha_programada: string;
  hora_programada?: string | null;
  motivo?: string | null;
  prioridad: PrioridadVisita;
  estado: EstadoVisita;
  responsable?: string | null;
  observaciones?: string | null;
  resultado?: string | null;
  proxima_visita?: string | null;
  fecha_realizada?: string | null;
  created_at?: string | null;
};