export type EstadoEntrega =
  | "pendiente"
  | "a_entregar"
  | "entregado"
  | "papelera";

export type PrioridadEntrega =
  | "normal"
  | "urgente"
  | "critico";

export interface Entrega {
  id: number;
  cliente: string;

  fecha_pedido?: string | null;
  fecha_entrega_programada?: string | null;
  fecha_entregado?: string | null;
  fecha_entregado_real?: string | null;
  factura_firmada_url?: string | null;
  numero_factura: string;
  observacion_entrega?: string | null;
  monto: number;
  recibido_por?: string | null;
  observaciones?: string | null;

  estado: EstadoEntrega;

  prioridad?: PrioridadEntrega | null;

  telefono_cliente?: string | null;
  direccion?: string | null;
  departamento?: string | null;

  created_at?: string;
qr_token?: string | null;

fecha_qr_entregado?: string | null;

}
