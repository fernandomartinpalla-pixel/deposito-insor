export type EstadoCobro =
  | "pendiente"
  | "cobrado"
  | "no_cobrado"
  | "reprogramado";

export type MonedaCobro = "UYU" | "USD";

export type Cobro = {
  id: number;
  cliente_id?: number | null;
  cliente: string;
  direccion?: string | null;
  departamento?: string | null;
  telefono?: string | null;
  factura?: string | null;
  moneda: MonedaCobro;
  monto: number;
  fecha_programada: string;
  estado: EstadoCobro;
  responsable?: string | null;
  observaciones?: string | null;
  forma_cobro?: string | null;
  fecha_cobrado?: string | null;
  created_at?: string | null;
};